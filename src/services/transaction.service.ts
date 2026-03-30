import { supabaseAdmin } from '../lib/supabase'
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
    return data
}

export const getTransactions = async (organisationId: string) => {
    const { data, error } = await supabaseAdmin
        .from('transactions')
        .select('id, organisations_id, category_id, amount, date, description, created_at')
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
            'id, organisations_id, category_id, amount, date, description, created_at, category:categories!inner(id, name, type)',
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

export const updateTransaction = async (id: string, amount: number, date: string, description: string | null) => {
    const { data, error } = await supabaseAdmin
        .from('transactions')
        .update({ amount, date, description, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select('id, organisations_id, category_id, amount, date, description, created_at')
        .single()

    if (error || !data) throw new Error('Kunne ikke opdatere transaktion.')
    return data
}

export const deleteTransaction = async (id: string) => {
    const { error } = await supabaseAdmin
        .from('transactions')
        .update({ is_deleted: true })
        .eq('id', id)

    if (error) throw new Error('Kunne ikke slette transaktion.')
}
