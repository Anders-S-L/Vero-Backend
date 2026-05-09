import { db, supabaseAdmin } from '../lib/supabase'

type RequesterProfile = {
    id: string
    organisations_id: string
    role: 'admin' | 'manager' | 'employee'
}

type AuthEmailById = Record<string, string>

type ProfileRow = {
    id: string
    full_name?: string | null
    role?: 'admin' | 'manager' | 'employee'
    is_active?: boolean
    invited_by?: string | null
    created_at?: string
    organisations_id?: string
}

type DepartmentAccessRow = {
    profile_id: string
    department_id: string
    departments: {
        id: string
        name: string
    } | null
}

const findAuthEmailsByIds = async (userIds: string[]) => {
    const lookup: AuthEmailById = {}

    if (!userIds.length) return lookup

    const userIdSet = new Set(userIds)
    let page = 1
    const perPage = 200

    while (page <= 50) {
        const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage })

        // Fallback: Hvis auth-opslag fejler, returnerer vi profiler uden email fremfor at fejle hele endpointet.
        if (error) return lookup

        const users = data.users || []

        users.forEach((user) => {
            if (user.id && user.email && userIdSet.has(user.id)) {
                lookup[user.id] = user.email
            }
        })

        const allFound = userIds.every((id) => lookup[id])
        if (allFound || users.length < perPage) break

        page += 1
    }

    return lookup
}

const getProfilesForOrganisation = async (organisationId: string) => {
    const preferredQuery = await db
        .from('profiles')
        .select('id, full_name, role, is_active, invited_by, created_at, organisations_id')
        .eq('organisations_id', organisationId)
        .order('created_at', { ascending: true })

    if (!preferredQuery.error && preferredQuery.data) {
        return preferredQuery.data as ProfileRow[]
    }

    const fallbackQuery = await db
        .from('profiles')
        .select('*')
        .eq('organisations_id', organisationId)
        .order('created_at', { ascending: true })

    if (fallbackQuery.error || !fallbackQuery.data) {
        throw new Error(preferredQuery.error?.message || fallbackQuery.error?.message || 'Kunne ikke hente profiler.')
    }

    return fallbackQuery.data as ProfileRow[]
}

export const getProfilesService = async (requesterProfile: RequesterProfile) => {
    let profiles = await getProfilesForOrganisation(requesterProfile.organisations_id)
    const profileIds = profiles.map((profile) => profile.id)


    const { data: departmentAccessData } = await db
        .from('profile_department_access')
        .select('profile_id, department_id, departments(id, name)')
        .in('profile_id', profileIds)

    const departmentByProfileId = new Map<string, DepartmentAccessRow>()
    const departmentIdsByProfileId = new Map<string, Set<string>>()

        ; (departmentAccessData as DepartmentAccessRow[] | null)?.forEach((row) => {
            if (!departmentByProfileId.has(row.profile_id)) {
                departmentByProfileId.set(row.profile_id, row)
            }

            const departmentIds = departmentIdsByProfileId.get(row.profile_id) ?? new Set<string>()
            departmentIds.add(row.department_id)
            departmentIdsByProfileId.set(row.profile_id, departmentIds)
        })

    if (requesterProfile.role === 'manager' || requesterProfile.role === 'employee') {
        const requesterDepartmentIds = departmentIdsByProfileId.get(requesterProfile.id) ?? new Set<string>()

        profiles = profiles.filter((profile) => {
            if (profile.id === requesterProfile.id) return true
            if (profile.role === 'admin') return false
            const profileDepartmentIds = departmentIdsByProfileId.get(profile.id)
            return Boolean(
                profileDepartmentIds &&
                [...profileDepartmentIds].some((departmentId) => requesterDepartmentIds.has(departmentId)),
            )
        })
    }

    const visibleProfileIds = profiles.map((profile) => profile.id)
    const emailsById = await findAuthEmailsByIds(visibleProfileIds)

    return profiles.map((profile) => {
        const primaryDepartment = departmentByProfileId.get(profile.id)


        return {
            id: profile.id,
            full_name: profile.full_name || null,
            role: profile.role || 'employee',
            is_active: profile.is_active ?? true,
            invited_by: profile.invited_by || null,
            created_at: profile.created_at || new Date().toISOString(),
            organisations_id: profile.organisations_id || requesterProfile.organisations_id,
            email: emailsById[profile.id] || null,
            department_id: primaryDepartment?.department_id || null,
            departments: primaryDepartment?.departments || null,
        }
    })
}

export const getOwnProfileService = async (requesterProfile: RequesterProfile) => {
    const { data, error } = await db
        .from('profiles')
        .select('id, full_name, role')
        .eq('id', requesterProfile.id)
        .eq('organisations_id', requesterProfile.organisations_id)
        .single()

    if (error || !data) throw new Error('Kunne ikke hente profil.')

    const { data: departmentAccess } = await db
        .from('profile_department_access')
        .select('department_id')
        .eq('profile_id', requesterProfile.id)
        .limit(1)

    return {
        id: data.id,
        full_name: data.full_name || null,
        role: data.role || requesterProfile.role,
        department_id: departmentAccess?.[0]?.department_id || null,
    }
}

export const updateOwnProfileNameService = async (requesterProfile: RequesterProfile, fullName: string) => {
    const { data, error } = await db
        .from('profiles')
        .update({ full_name: fullName })
        .eq('id', requesterProfile.id)
        .eq('organisations_id', requesterProfile.organisations_id)
        .select('id, full_name, role')
        .single()

    if (error || !data) throw new Error('Kunne ikke opdatere profil.')

    const { data: departmentAccess } = await db
        .from('profile_department_access')
        .select('department_id')
        .eq('profile_id', requesterProfile.id)
        .limit(1)

    return {
        id: data.id,
        full_name: data.full_name || null,
        role: data.role || requesterProfile.role,
        department_id: departmentAccess?.[0]?.department_id || null,
    }
}
