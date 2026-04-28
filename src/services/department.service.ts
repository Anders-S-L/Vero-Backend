import { db } from '../lib/supabase'

export const createDepartmentService = async (organisationId: string, name: string) => {
    const { data: existing } = await db
        .from('departments')
        .select('id')
        .eq('organisations_id', organisationId)
        .eq('is_active', true)
        .ilike('name', name)
        .maybeSingle()

    if (existing) throw new Error('Et department med det navn findes allerede.')

    const { data, error } = await db
        .from('departments')
        .insert({ organisations_id: organisationId, name, is_active: true })
        .select('id, organisations_id, name, is_active, created_at')
        .single()

    if (error || !data) throw new Error('Kunne ikke oprette department.')
    return data
}

export const getDepartmentsService = async (organisationId: string) => {
    const { data, error } = await db
        .from('departments')
        .select('id, name, is_active, created_at')
        .eq('organisations_id', organisationId)
        .eq('is_active', true)
        .order('created_at', { ascending: true })

    if (error) throw new Error('Kunne ikke hente departments.')
    return data
}

const getDepartmentById = async (organisationId: string, id: string) => {
    const { data, error } = await db
        .from('departments')
        .select('id, organisations_id, name, is_active, created_at')
        .eq('id', id)
        .eq('organisations_id', organisationId)
        .eq('is_active', true)
        .single()

    if (error || !data) throw new Error('Kunne ikke finde department.')
    return data
}

export const updateDepartmentService = async (organisationId: string, id: string, name: string) => {
    await getDepartmentById(organisationId, id)

    const { data: existing } = await db
        .from('departments')
        .select('id')
        .eq('organisations_id', organisationId)
        .eq('is_active', true)
        .ilike('name', name)
        .neq('id', id)
        .maybeSingle()

    if (existing) throw new Error('Et department med det navn findes allerede.')

    const { data, error } = await db
        .from('departments')
        .update({ name })
        .eq('id', id)
        .eq('organisations_id', organisationId)
        .eq('is_active', true)
        .select('id, organisations_id, name, is_active, created_at')
        .single()

    if (error || !data) throw new Error('Kunne ikke opdatere department.')
    return data
}

export const deleteDepartmentService = async (organisationId: string, id: string) => {
    await getDepartmentById(organisationId, id)

    const { error: categoryError } = await db
        .from('categories')
        .update({ is_active: false })
        .eq('organisations_id', organisationId)
        .eq('department_id', id)
        .eq('is_active', true)

    if (categoryError) throw new Error('Kunne ikke deaktivere department-kategorier.')

    const { error } = await db
        .from('departments')
        .update({ is_active: false })
        .eq('id', id)
        .eq('organisations_id', organisationId)
        .eq('is_active', true)

    if (error) throw new Error('Kunne ikke slette department.')
}
