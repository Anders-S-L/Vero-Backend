import { supabaseAdmin } from '../lib/supabase'

export const createCategoryService = async (
    organizationId: string,
    departmentId: string,
    name: string,
    type: string,
) => {
    const { data: existing } = await supabaseAdmin
        .from('categories')
        .select('id')
        .eq('organization_id', organizationId)
        .eq('department_id', departmentId)
        .ilike('name', name)
        .maybeSingle()

    if (existing) throw new Error('En kategori med det navn findes allerede i denne afdeling.')

    const { data, error } = await supabaseAdmin
        .from('categories')
        .insert({
            organization_id: organizationId,
            department_id: departmentId,
            name,
            type,
            is_active: true,
        })
        .select('id, organization_id, department_id, name, type, is_active, created_at')
        .single()
    console.log('data:', data)
    console.log('error:', error)

    if (error || !data) throw new Error('Kunne ikke oprette kategori.')
    return data
}

export const getCategoriesService = async (organizationId: string, departmentId?: string) => {
    let query = supabaseAdmin
        .from('categories')
        .select('id, organization_id, department_id, name, type, is_active, created_at')
        .eq('organization_id', organizationId)
        .eq('is_active', true)

    if (departmentId) query = query.eq('department_id', departmentId)

    const { data, error } = await query.order('created_at', { ascending: true })

    if (error) throw new Error('Kunne ikke hente kategorier.')
    return data
}