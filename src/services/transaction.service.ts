import { db } from '../lib/supabase'
import { recalculateMonthlyKpis } from './kpi-value.service'
import { Transaction } from '../types'
import { assertCategoryAccess } from './category.service'

type AccessProfile = {
    id: string
    organisations_id: string
    role: 'admin' | 'manager' | 'employee'
}

const addMonths = (isoDate: string, months: number) => {
    const current = new Date(isoDate)
    current.setMonth(current.getMonth() + months)
    return current.toISOString().slice(0, 10)
}

const buildRecurringDates = (startDate: string, repeatUntil: string | null) => {
    if (!repeatUntil) return [startDate]
    const dates: string[] = []
    let index = 0
    let current = startDate

    while (new Date(current) <= new Date(repeatUntil)) {
        dates.push(current)
        index += 1
        current = addMonths(startDate, index)
    }

    return dates
}

export const createTransaction = async (
    profile: AccessProfile,
    amount: number,
    date: string,
    category_id: string,
    description: string | null,
    repeatMonthly = false,
    repeatUntil: string | null = null,
) => {
    const category = await assertCategoryAccess(profile, category_id)
    if (profile.role === 'employee' && !['income', 'expense'].includes(category.type)) {
        throw new Error('Medarbejdere kan kun oprette indtaegter og udgifter.')
    }

    const transactionDates = repeatMonthly ? buildRecurringDates(date, repeatUntil) : [date]
    const rows = transactionDates.map((transactionDate) => ({
        organisations_id: profile.organisations_id,
        created_by: profile.id,
        amount,
        date: transactionDate,
        category_id,
        description,
        is_deleted: false,
    }))

    const { data, error } = await db
        .from('transactions')
        .insert(rows)
        .select('id, organisations_id, category_id, amount, date, description, created_at')
        .order('date', { ascending: true })

    console.log('transaction data:', data)
    console.log('transaction error:', error)

    if (error || !data || data.length === 0) throw new Error('Kunne ikke oprette transaktion.')

    const uniqueMonths = Array.from(new Set(transactionDates.map((transactionDate) => transactionDate.slice(0, 7))))
    await Promise.all(uniqueMonths.map((month) => recalculateMonthlyKpis(profile.organisations_id, `${month}-01`)))

    if (!repeatMonthly) return data[0]

    return {
        recurring: true,
        created_count: data.length,
        repeat_until: repeatUntil,
        transactions: data,
    }
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

export const getTransactions = async (profile: AccessProfile) => {
    const accessibleDepartmentIds = await getAccessibleDepartmentIds(profile)
    if (accessibleDepartmentIds && accessibleDepartmentIds.length === 0) return []

    let query = db
        .from('transactions')
        .select(`
            id,
            organisations_id,
            category_id,
            amount,
            date,
            description,
            created_at,
            categories!inner (
                id,
                name,
                type,
                departments (
                    id,
                    name
                )
            )
        `)
        .eq('organisations_id', profile.organisations_id)
        .eq('is_deleted', false)

    if (accessibleDepartmentIds) {
        query = query.in('categories.department_id', accessibleDepartmentIds)
    }

    const { data, error } = await query.order('date', { ascending: false })

    if (error) throw new Error('Kunne ikke hente transaktioner.')
    return data
}

export const getTransactionsForKpi = async (
    organisationId: string,
    from: string,
    to: string,
): Promise<Transaction[]> => {
    // KPI-beregninger kræver kategoriens type, så vi joiner categories på hver transaktion.
    const { data, error } = await db
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
    const { data, error } = await db
        .from('transactions')
        .select('id, organisations_id, category_id, amount, date, description, created_at, is_deleted')
        .eq('id', id)
        .eq('organisations_id', organisationId)
        .single()

    if (error || !data) throw new Error('Kunne ikke finde transaktion.')
    return data
}

export const updateTransaction = async (profile: AccessProfile, id: string, amount: number, date: string, description: string | null) => {
    const existing = await getTransactionById(profile.organisations_id, id)
    await assertCategoryAccess(profile, existing.category_id)

    const { data, error } = await db
        .from('transactions')
        .update({ amount, date, description, updated_at: new Date().toISOString() })
        .eq('id', id)
        .eq('organisations_id', profile.organisations_id)
        .select('id, organisations_id, category_id, amount, date, description, created_at')
        .single()

    if (error || !data) throw new Error('Kunne ikke opdatere transaktion.')
    await recalculateMonthlyKpis(profile.organisations_id, existing.date)
    if (existing.date !== date) await recalculateMonthlyKpis(profile.organisations_id, date)
    return data
}

export const deleteTransaction = async (profile: AccessProfile, id: string) => {
    const existing = await getTransactionById(profile.organisations_id, id)
    await assertCategoryAccess(profile, existing.category_id)

    const { error } = await db
        .from('transactions')
        .update({ is_deleted: true })
        .eq('id', id)
        .eq('organisations_id', profile.organisations_id)

    if (error) throw new Error('Kunne ikke slette transaktion.')
    await recalculateMonthlyKpis(profile.organisations_id, existing.date)
}
