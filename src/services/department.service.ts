import { supabaseAdmin } from '../lib/supabase'

export const createDepartmentService = async (organizationId: string, name: string) => {
    const { data: existing } = await supabaseAdmin
        .from('departments')
        .select('id')
        .eq('organisations_id', organizationId)
        .ilike('name', name)
        .maybeSingle()

    if (existing) throw new Error('Et department med det navn findes allerede.')

    const { data, error } = await supabaseAdmin
        .from('departments')
        .insert({ organisations_id: organizationId, name, is_active: true })
        .select('id, organisations_id, name, is_active, created_at')
        .single()

    if (error || !data) throw new Error('Kunne ikke oprette department.')
    return data
}

export const getDepartmentsService = async (organizationId: string) => {
    const { data, error } = await supabaseAdmin
        .from('departments')
        .select('id, name, is_active, created_at')
        .eq('organisations_id', organizationId)
        .order('created_at', { ascending: true })

    if (error) throw new Error('Kunne ikke hente departments.')
    return data
}