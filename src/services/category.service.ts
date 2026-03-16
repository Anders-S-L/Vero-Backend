import { supabaseAdmin } from '../lib/supabase'

export const createCategoryService = async (
    organisationId: string,
    departmentId: string,
    name: string,
    type: string,
) => {
    const { data: existing } = await supabaseAdmin
        .from('categories')
        .select('id')
        .eq('organisations_id', organisationId)
        .eq('department_id', departmentId)
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