import { db, supabaseAdmin } from '../lib/supabase'
import { InviteEmployeeRequest, LoginRequest, UserRole } from '../types/index'

type RegisterOwnerInput = {
    email: string
    password: string
    fullName: string
    organisationName: string
    cvr?: string
    currency: string
    fiscalYearStart: number
}

type InviterProfile = {
    id: string
    organisations_id: string
    role: string
    is_active: boolean
}

const normalizeRole = (role: unknown): UserRole | null => {
    const normalized = typeof role === 'string' ? role.toLowerCase().trim() : ''
    return ['admin', 'manager', 'employee'].includes(normalized) ? normalized as UserRole : null
}

const getInviteRedirectTo = () => {
    const inviteRedirectUrl = process.env.INVITE_REDIRECT_URL?.trim()

    if (!inviteRedirectUrl) return undefined

    return inviteRedirectUrl
}

const findAuthUserByEmail = async (email: string) => {
    let page = 1
    const perPage = 200

    while (page <= 50) {
        const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage })

        if (error) throw new Error('Kunne ikke slå bruger op via email.')

        const users = data.users || []
        const matchedUser = users.find((user) => user.email?.toLowerCase() === email.toLowerCase())

        if (matchedUser) return matchedUser
        if (users.length < perPage) break

        page += 1
    }

    return null
}

const validateInvitePermissions = (inviter: InviterProfile, invitedRole: InviteEmployeeRequest['role']) => {
    const inviterRole = normalizeRole(inviter.role)
    if (inviterRole === 'admin') return
    if (inviterRole === 'manager' && invitedRole === 'employee') return

    throw new Error('Du har ikke rettigheder til at invitere denne rolle.')
}

const validateInviteDepartmentAccess = async (inviter: InviterProfile, departmentId: string) => {
    if (normalizeRole(inviter.role) === 'admin') return

    const { data, error } = await supabaseAdmin
        .from('profile_department_access')
        .select('department_id')
        .eq('profile_id', inviter.id)
        .eq('department_id', departmentId)
        .maybeSingle()

    if (error || !data) {
        throw new Error('Du kan kun invitere medarbejdere til din egen afdeling.')
    }
}

export const registerOwnerWithOrganization = async (input: RegisterOwnerInput) => {
    const authResult = await supabaseAdmin.auth.admin.createUser({
        email: input.email,
        password: input.password,
        email_confirm: true,
        user_metadata: {
            full_name: input.fullName,
        },
    })

    if (authResult.error || !authResult.data.user) {
        throw new Error(authResult.error?.message || 'Kunne ikke oprette auth-bruger.')
    }

    const userId = authResult.data.user.id

    const organisationResult = await supabaseAdmin
        .from('organisations')
        .insert({
            name: input.organisationName,
            CVR: input.cvr,
            currency: input.currency,
            fiscal_year_start: input.fiscalYearStart,
        })
        .select('id')
        .single()

    if (organisationResult.error || !organisationResult.data) {
        await supabaseAdmin.auth.admin.deleteUser(userId)
        throw new Error(organisationResult.error?.message || 'Kunne ikke oprette virksomhed.')
    }

    const organisationId = organisationResult.data.id as string

    const profileResult = await supabaseAdmin.from('profiles').insert({
        id: userId,
        organisations_id: organisationId,
        full_name: input.fullName,
        role: 'admin',
        is_active: true,
        invited_by: null,
    })

    if (profileResult.error) {
        await supabaseAdmin.from('organisations').delete().eq('id', organisationId)
        await supabaseAdmin.auth.admin.deleteUser(userId)
        throw new Error(profileResult.error.message || 'Kunne ikke oprette profil.')
    }

    return {
        userId,
        organisationId,
        role: 'admin' as const,
    }
}

export const inviteEmployeeToOrganization = async (inviterId: string, input: InviteEmployeeRequest) => {
    const { data: inviter, error: inviterError } = await supabaseAdmin
        .from('profiles')
        .select('id, organisations_id, role, is_active')
        .eq('id', inviterId)
        .single<InviterProfile>()

    if (inviterError || !inviter || !inviter.is_active) {
        throw new Error('Kunne ikke validere inviterende bruger.')
    }

    validateInvitePermissions(inviter, input.role)

    const { data: department, error: departmentError } = await supabaseAdmin
        .from('departments')
        .select('id')
        .eq('id', input.departmentId)
        .eq('organisations_id', inviter.organisations_id)
        .eq('is_active', true)
        .maybeSingle()

    if (departmentError || !department) {
        throw new Error('Valgt afdeling findes ikke i organisationen.')
    }

    await validateInviteDepartmentAccess(inviter, input.departmentId)

    const existingAuthUser = await findAuthUserByEmail(input.email)

    if (existingAuthUser) {
        const { data: existingProfile } = await supabaseAdmin
            .from('profiles')
            .select('id, organisations_id')
            .eq('id', existingAuthUser.id)
            .maybeSingle()

        if (existingProfile?.organisations_id === inviter.organisations_id) {
            throw new Error('Denne bruger eksisterer i organisationen.')
        }

        if (existingProfile && existingProfile.organisations_id !== inviter.organisations_id) {
            throw new Error('Brugeren er allerede tilknyttet en anden organisation.')
        }
    }

    const inviteResult = await supabaseAdmin.auth.admin.inviteUserByEmail(input.email, {
        redirectTo: getInviteRedirectTo(),
        data: {
            full_name: input.fullName,
            role: input.role,
            department_id: input.departmentId,
        },
    })

    if (inviteResult.error || !inviteResult.data.user) {
        throw new Error(inviteResult.error?.message || 'Kunne ikke sende invitation.')
    }

    const invitedUserId = inviteResult.data.user.id

    const { error: profileError } = await supabaseAdmin.from('profiles').insert({
        id: invitedUserId,
        organisations_id: inviter.organisations_id,
        full_name: input.fullName,
        role: input.role,
        is_active: true,
        invited_by: inviter.id,
    })

    if (profileError) {
        await supabaseAdmin.auth.admin.deleteUser(invitedUserId)
        throw new Error(profileError.message || 'Kunne ikke oprette pending profil.')
    }

    const { error: accessError } = await supabaseAdmin.from('profile_department_access').insert({
        profile_id: invitedUserId,
        department_id: input.departmentId,
        granted_by: inviter.id,
    })

    if (accessError) {
        await supabaseAdmin.from('profiles').delete().eq('id', invitedUserId)
        await supabaseAdmin.auth.admin.deleteUser(invitedUserId)
        throw new Error(accessError.message || 'Kunne ikke tilknytte afdeling til inviteret bruger.')
    }

    return {
        userId: invitedUserId,
        email: input.email,
        fullName: input.fullName,
        role: input.role,
        departmentId: input.departmentId,
        status: 'pending' as const,
    }
}

export const loginWithEmailPassword = async (input: LoginRequest) => {
    const loginResult = await supabaseAdmin.auth.signInWithPassword({
        email: input.email,
        password: input.password,
    })

    if (loginResult.error || !loginResult.data.session || !loginResult.data.user) {
        throw new Error(loginResult.error?.message || 'Login fejlede.')
    }
    const { data: profile, error: profileError } = await db
        .from('profiles')
        .select('full_name, role, organisations_id, is_active')
        .eq('id', loginResult.data.user.id)
        .single()

    if (profileError || !profile) {
        throw new Error('Brugeren har ingen aktiv profil i Vero.')
    }

    const role = normalizeRole(profile.role)
    if (!role) {
        throw new Error('Brugerprofilen har en ugyldig rolle.')
    }

    if (profile && !profile.is_active) {
        const { error: activationError } = await db
            .from('profiles')
            .update({ is_active: true })
            .eq('id', loginResult.data.user.id)

        if (activationError) {
            throw new Error('Kunne ikke aktivere brugerprofil ved første login.')
        }

        profile.is_active = true
    }

    const { data: organisation } = await db
        .from('organisations')
        .select('name')
        .eq('id', profile?.organisations_id)
        .single()



    return {
        userId: loginResult.data.user.id,
        accessToken: loginResult.data.session.access_token,
        refreshToken: loginResult.data.session.refresh_token,
        expiresIn: loginResult.data.session.expires_in,
        tokenType: loginResult.data.session.token_type,
        fullName: profile?.full_name,
        role,
        organisationName: organisation?.name,
    }
}
