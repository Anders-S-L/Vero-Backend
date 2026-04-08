import { supabaseAdmin } from '../lib/supabase'

export const createCategory = async (
    organisationsId: string,
    data: {
        name: string
        type: string
        department_id: string
        statement_section: string | null
        cost_behavior: string | null
        is_cash: boolean
    }
) => {
    const { data: category, error } = await supabaseAdmin
        .from('categories')
        .insert({
            organisations_id: organisationsId,
            name: data.name,
            type: data.type,
            department_id: data.department_id,
            statement_section: data.statement_section,
            cost_behavior: data.cost_behavior,
            is_cash: data.is_cash,
        })
        .select()
        .single()

    if (error) throw new Error(error.message)
    return category
}

export const getCategories = async (organisationsId: string, departmentId?: string) => {
    let query = supabaseAdmin
        .from('categories')
        .select('*')
        .eq('organisations_id', organisationsId)
        .eq('is_active', true)

    if (departmentId) {
        query = query.eq('department_id', departmentId)
    }

    const { data, error } = await query
    if (error) throw new Error(error.message)
    return data
}