import { supabaseAdmin } from '../lib/supabase'
import { LoginRequest } from '../types/index'

type RegisterOwnerInput = {
    email: string
    password: string
    fullName: string
    organizationName: string
    cvr?: string
    currency: string
    fiscalYearStart: number
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
            name: input.organizationName,
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

    const organizationId = organisationResult.data.id as string

    const profileResult = await supabaseAdmin.from('profiles').insert({
        id: userId,
        organization_id: organizationId,
        full_name: input.fullName,
        role: 'admin',
        is_active: true,
        invited_by: null,
    })

    if (profileResult.error) {
        await supabaseAdmin.from('organisations').delete().eq('id', organizationId)
        await supabaseAdmin.auth.admin.deleteUser(userId)
        throw new Error(profileResult.error.message || 'Kunne ikke oprette profil.')
    }

    return {
        userId,
        organizationId,
        role: 'admin' as const,
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

    return {
        userId: loginResult.data.user.id,
        accessToken: loginResult.data.session.access_token,
        refreshToken: loginResult.data.session.refresh_token,
        expiresIn: loginResult.data.session.expires_in,
        tokenType: loginResult.data.session.token_type,
    }
}