import { supabaseAdmin } from '../lib/supabase'

type AuthEmailById = Record<string, string>

type ProfileRow = {
    id: string
    full_name?: string | null
    role?: 'admin' | 'manager' | 'employee' | 'auditor'
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
    const preferredQuery = await supabaseAdmin
        .from('profiles')
        .select('id, full_name, role, is_active, invited_by, created_at, organisations_id')
        .eq('organisations_id', organisationId)
        .order('created_at', { ascending: true })

    if (!preferredQuery.error && preferredQuery.data) {
        return preferredQuery.data as ProfileRow[]
    }

    const fallbackQuery = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('organisations_id', organisationId)
        .order('created_at', { ascending: true })

    if (fallbackQuery.error || !fallbackQuery.data) {
        throw new Error(preferredQuery.error?.message || fallbackQuery.error?.message || 'Kunne ikke hente profiler.')
    }

    return fallbackQuery.data as ProfileRow[]
}

export const getProfilesService = async (requesterId: string) => {
    const { data: requesterProfile, error: requesterProfileError } = await supabaseAdmin
        .from('profiles')
        .select('organisations_id')
        .eq('id', requesterId)
        .single()

    if (requesterProfileError || !requesterProfile) {
        throw new Error('Kunne ikke finde brugerens organisation.')
    }


    const profiles = await getProfilesForOrganisation(requesterProfile.organisations_id)
    const profileIds = profiles.map((profile) => profile.id)


    const { data: departmentAccessData } = await supabaseAdmin
        .from('profile_department_access')
        .select('profile_id, department_id, departments(id, name)')
        .in('profile_id', profileIds)

    const departmentByProfileId = new Map<string, DepartmentAccessRow>()
        ; (departmentAccessData as DepartmentAccessRow[] | null)?.forEach((row) => {
            if (!departmentByProfileId.has(row.profile_id)) {
                departmentByProfileId.set(row.profile_id, row)
            }
        })

    const emailsById = await findAuthEmailsByIds(profileIds)

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