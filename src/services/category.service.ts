import { db } from '../lib/supabase'

type AccessProfile = {
    id: string
    organisations_id: string
    role: 'admin' | 'manager' | 'employee'
}

const getAccessibleDepartmentIds = async (profile: AccessProfile) => {
    if (profile.role === 'admin') return null

    const { data, error } = await db
        .from('profile_department_access')
        .select('department_id')
        .eq('profile_id', profile.id)

    if (error) throw new Error('Kunne ikke validere afdelingstilgang.')
    return (data ?? []).map((row) => row.department_id as string)
}

export const assertDepartmentAccess = async (profile: AccessProfile, departmentId: string) => {
    if (profile.role === 'admin') return

    const { data, error } = await db
        .from('profile_department_access')
        .select('department_id')
        .eq('profile_id', profile.id)
        .eq('department_id', departmentId)
        .maybeSingle()

    if (error || !data) throw new Error('Du har ikke adgang til denne afdeling.')
}

export const assertCategoryAccess = async (profile: AccessProfile, categoryId: string) => {
    const { data: category, error } = await db
        .from('categories')
        .select('id, department_id, type')
        .eq('id', categoryId)
        .eq('organisations_id', profile.organisations_id)
        .eq('is_active', true)
        .single()

    if (error || !category) throw new Error('Kunne ikke finde kategori.')
    await assertDepartmentAccess(profile, category.department_id)
    return category
}

export const createCategoryService = async (
    profile: AccessProfile,
    departmentId: string,
    name: string,
    type: string,
) => {
    await assertDepartmentAccess(profile, departmentId)

    const { data: department, error: departmentError } = await db
        .from('departments')
        .select('id')
        .eq('id', departmentId)
        .eq('organisations_id', profile.organisations_id)
        .eq('is_active', true)
        .single()

    if (departmentError || !department) throw new Error('Kunne ikke finde department.')

    const { data: existing } = await db
        .from('categories')
        .select('id')
        .eq('organisations_id', profile.organisations_id)
        .eq('department_id', departmentId)
        .eq('is_active', true)
        .ilike('name', name)
        .maybeSingle()

    if (existing) throw new Error('En kategori med det navn findes allerede i denne afdeling.')

    const { data, error } = await db
        .from('categories')
        .insert({
            organisations_id: profile.organisations_id,
            department_id: departmentId,
            name,
            type,
            is_active: true,
        })
        .select('id, organisations_id, department_id, name, type, is_active, created_at')
        .single()
    console.log('data:', data)
    console.log('error:', error)

    if (error || !data) throw new Error('Kunne ikke oprette kategori.')
    return data
}

export const getCategoriesService = async (profile: AccessProfile, departmentId?: string) => {
    if (departmentId) await assertDepartmentAccess(profile, departmentId)

    const accessibleDepartmentIds = await getAccessibleDepartmentIds(profile)
    if (accessibleDepartmentIds && accessibleDepartmentIds.length === 0) return []

    let query = db
        .from('categories')
        .select('id, organisations_id, department_id, name, type, is_active, created_at')
        .eq('organisations_id', profile.organisations_id)
        .eq('is_active', true)

    if (departmentId) query = query.eq('department_id', departmentId)
    if (!departmentId && accessibleDepartmentIds) query = query.in('department_id', accessibleDepartmentIds)

    const { data, error } = await query.order('created_at', { ascending: true })

    if (error) throw new Error('Kunne ikke hente kategorier.')
    return data
}

const getCategoryById = async (organisationId: string, id: string) => {
    const { data, error } = await db
        .from('categories')
        .select('id, organisations_id, department_id, name, type, is_active, created_at')
        .eq('id', id)
        .eq('organisations_id', organisationId)
        .eq('is_active', true)
        .single()

    if (error || !data) throw new Error('Kunne ikke finde kategori.')
    return data
}

export const updateCategoryService = async (profile: AccessProfile, id: string, name: string, type: string) => {
    const existingCategory = await getCategoryById(profile.organisations_id, id)
    await assertDepartmentAccess(profile, existingCategory.department_id)

    const { data: existing } = await db
        .from('categories')
        .select('id')
        .eq('organisations_id', profile.organisations_id)
        .eq('department_id', existingCategory.department_id)
        .eq('is_active', true)
        .ilike('name', name)
        .neq('id', id)
        .maybeSingle()

    if (existing) throw new Error('En kategori med det navn findes allerede i denne afdeling.')

    const { data, error } = await db
        .from('categories')
        .update({ name, type })
        .eq('id', id)
        .eq('organisations_id', profile.organisations_id)
        .eq('is_active', true)
        .select('id, organisations_id, department_id, name, type, is_active, created_at')
        .single()

    if (error || !data) throw new Error('Kunne ikke opdatere kategori.')
    return data
}

export const deleteCategoryService = async (profile: AccessProfile, id: string) => {
    const existingCategory = await getCategoryById(profile.organisations_id, id)
    await assertDepartmentAccess(profile, existingCategory.department_id)

    const { error } = await db
        .from('categories')
        .update({ is_active: false })
        .eq('id', id)
        .eq('organisations_id', profile.organisations_id)
        .eq('is_active', true)

    if (error) throw new Error('Kunne ikke slette kategori.')
}
