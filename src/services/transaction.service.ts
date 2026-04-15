import { supabaseAdmin } from '../lib/supabase'
import { recalculateMonthlyKpis } from './kpi-value.service'
import { Transaction } from '../types'

export const createTransaction = async (organisationId: string, userId: string, amount: number, date: string, category_id: string, description: string | null) => {
    const { data, error } = await supabaseAdmin
        .from('transactions')
        .insert({ organisations_id: organisationId, created_by: userId, amount, date, category_id, description, is_deleted: false })
        .select('id, organisations_id, category_id, amount, date, description, created_at')
        .single()

    console.log('transaction data:', data)
    console.log('transaction error:', error)

    if (error || !data) throw new Error('Kunne ikke oprette transaktion.')
    await recalculateMonthlyKpis(organisationId, date)
    return data
}

export const getTransactions = async (organisationId: string) => {
    const { data, error } = await supabaseAdmin
        .from('transactions')
        .select(`
            id,
            organisations_id,
            category_id,
            amount,
            date,
            description,
            created_at,
            categories (
                id,
                name,
                type,
                departments (
                    id,
                    name
                )
            )
        `)
        .eq('organisations_id', organisationId)
        .eq('is_deleted', false)
        .order('date', { ascending: false })

    if (error) throw new Error('Kunne ikke hente transaktioner.')
    return data
}

export const getTransactionsForKpi = async (
    organisationId: string,
    from: string,
    to: string,
): Promise<Transaction[]> => {
    // KPI-beregninger kræver kategoriens type, så vi joiner categories på hver transaktion.
    const { data, error } = await supabaseAdmin
        .from('transactions')
        .select(
            'id, organisations_id, category_id, amount, date, description, created_at, category:categories!inner(id, name, type, statement_section, cost_behavior, is_cash)',
        )
        .eq('organisations_id', organisationId)
        .eq('is_deleted', false)
        .gte('date', from)
        .lte('date', to)
        .order('date', { ascending: true })

    if (error) throw new Error('Kunne ikke hente transaktioner til KPI.')

    // Supabase returnerer relationen som array i typen; her normaliserer vi til én kategori pr. transaktion.
    return (data ?? []).map((transaction) => ({
        ...transaction,
        category: Array.isArray(transaction.category) ? transaction.category[0] ?? null : transaction.category,
    })) as Transaction[]
}

const getTransactionById = async (organisationId: string, id: string) => {
    const { data, error } = await supabaseAdmin
        .from('transactions')
        .select('id, organisations_id, category_id, amount, date, description, created_at, is_deleted')
        .eq('id', id)
        .eq('organisations_id', organisationId)
        .single()

    if (error || !data) throw new Error('Kunne ikke finde transaktion.')
    return data
}

export const updateTransaction = async (organisationId: string, id: string, amount: number, date: string, description: string | null) => {
    const existing = await getTransactionById(organisationId, id)
    const { data, error } = await supabaseAdmin
        .from('transactions')
        .update({ amount, date, description, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('organisations_id', organisationId)
        .select('id, organisations_id, category_id, amount, date, description, created_at')
        .single()

    if (error || !data) throw new Error('Kunne ikke opdatere transaktion.')
    await recalculateMonthlyKpis(organisationId, existing.date)
    if (existing.date !== date) await recalculateMonthlyKpis(organisationId, date)
    return data
}

export const deleteTransaction = async (organisationId: string, id: string) => {
    const existing = await getTransactionById(organisationId, id)
    const { error } = await supabaseAdmin
        .from('transactions')
        .update({ is_deleted: true })
        .eq('id', id)
        .eq('organisations_id', organisationId)

    if (error) throw new Error('Kunne ikke slette transaktion.')
    await recalculateMonthlyKpis(organisationId, existing.date)
}
