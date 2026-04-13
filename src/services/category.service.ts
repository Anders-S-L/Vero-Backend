import { supabaseAdmin } from '../lib/supabase'

export const createCategoryService = async (
    organisationId: string,
    departmentId: string,
    name: string,
    type: string,
) => {
    const { data: department, error: departmentError } = await supabaseAdmin
        .from('departments')
        .select('id')
        .eq('id', departmentId)
        .eq('organisations_id', organisationId)
        .eq('is_active', true)
        .single()

    if (departmentError || !department) throw new Error('Kunne ikke finde department.')

    const { data: existing } = await supabaseAdmin
        .from('categories')
        .select('id')
        .eq('organisations_id', organisationId)
        .eq('department_id', departmentId)
        .eq('is_active', true)
        .ilike('name', name)
        .maybeSingle()

    if (existing) throw new Error('En kategori med det navn findes allerede i denne afdeling.')

    const { data, error } = await supabaseAdmin
        .from('categories')
        .insert({
            organisations_id: organisationId,
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

export const getCategoriesService = async (organisationId: string, departmentId?: string) => {
    let query = supabaseAdmin
        .from('categories')
        .select('id, organisations_id, department_id, name, type, is_active, created_at')
        .eq('organisations_id', organisationId)
        .eq('is_active', true)

    if (departmentId) query = query.eq('department_id', departmentId)

    const { data, error } = await query.order('created_at', { ascending: true })

    if (error) throw new Error('Kunne ikke hente kategorier.')
    return data
}

const getCategoryById = async (organisationId: string, id: string) => {
    const { data, error } = await supabaseAdmin
        .from('categories')
        .select('id, organisations_id, department_id, name, type, is_active, created_at')
        .eq('id', id)
        .eq('organisations_id', organisationId)
        .eq('is_active', true)
        .single()

    if (error || !data) throw new Error('Kunne ikke finde kategori.')
    return data
}

export const updateCategoryService = async (organisationId: string, id: string, name: string, type: string) => {
    const existingCategory = await getCategoryById(organisationId, id)

    const { data: existing } = await supabaseAdmin
        .from('categories')
        .select('id')
        .eq('organisations_id', organisationId)
        .eq('department_id', existingCategory.department_id)
        .eq('is_active', true)
        .ilike('name', name)
        .neq('id', id)
        .maybeSingle()

    if (existing) throw new Error('En kategori med det navn findes allerede i denne afdeling.')

    const { data, error } = await supabaseAdmin
        .from('categories')
        .update({ name, type })
        .eq('id', id)
        .eq('organisations_id', organisationId)
        .eq('is_active', true)
        .select('id, organisations_id, department_id, name, type, is_active, created_at')
        .single()

    if (error || !data) throw new Error('Kunne ikke opdatere kategori.')
    return data
}

export const deleteCategoryService = async (organisationId: string, id: string) => {
    await getCategoryById(organisationId, id)

    const { error } = await supabaseAdmin
        .from('categories')
        .update({ is_active: false })
        .eq('id', id)
        .eq('organisations_id', organisationId)
        .eq('is_active', true)

    if (error) throw new Error('Kunne ikke slette kategori.')
}
