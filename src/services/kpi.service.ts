import { supabaseAdmin } from '../lib/supabase'

interface Transaction {
    amount: number
    date: string
    categories: {
        type: string
        statement_section: string | null
        cost_behavior: string | null
        is_cash: boolean
    } | null
}

const getTransactions = async (
    organisationsId: string,
    from?: string,
    to?: string
): Promise<Transaction[]> => {
    let query = supabaseAdmin
        .from('transactions')
        .select('amount, date, categories(type, statement_section, cost_behavior, is_cash)')
        .eq('organisations_id', organisationsId)
        .eq('is_deleted', false)

    if (from) query = query.gte('date', from)
    if (to) query = query.lte('date', to)

    const { data, error } = await query
    if (error) throw new Error(error.message)
    return (data as unknown as Transaction[]) ?? []
}

export const calculateKPIs = async (
    organisationsId: string,
    from?: string,
    to?: string
) => {
    const transactions = await getTransactions(organisationsId, from, to)

    const sum = (txs: Transaction[]) =>
        txs.reduce((acc, t) => acc + Number(t.amount), 0)

    const bySection = (section: string) =>
        transactions.filter(t => t.categories?.statement_section === section)

    const byCostBehavior = (behavior: string) =>
        transactions.filter(t => t.categories?.cost_behavior === behavior)

    // ── Core KPIs ─────────────────────────────────────────────
    const revenue      = sum(transactions.filter(t => t.categories?.type === 'income'))
    const allExpenses  = Math.abs(sum(transactions.filter(t => t.categories?.type === 'expense')))
    const taxAmount    = Math.abs(sum(transactions.filter(t => t.categories?.type === 'tax')))
    const depreciation = Math.abs(sum(transactions.filter(t => t.categories?.type === 'depreciation')))
    const cashInflows  = sum(transactions.filter(t => t.categories?.is_cash && t.amount > 0))
    const cashOutflows = sum(transactions.filter(t => t.categories?.is_cash && t.amount < 0))

    const ebitda    = revenue - allExpenses
    const netResult = ebitda - taxAmount - depreciation
    const cashFlow  = cashInflows + cashOutflows
    const burnRate  = Math.abs(Math.min(cashFlow, 0))

    // ── Monthly growth rate ────────────────────────────────────
    const byMonth: Record<string, number> = {}
    for (const t of transactions) {
        const month = t.date.slice(0, 7)
        byMonth[month] = (byMonth[month] ?? 0) + Number(t.amount)
    }
    const months = Object.keys(byMonth).sort()
    let monthlyGrowthRate: number | null = null
    if (months.length >= 2) {
        const prev = byMonth[months[months.length - 2]]
        const curr = byMonth[months[months.length - 1]]
        monthlyGrowthRate = prev !== 0 ? ((curr - prev) / Math.abs(prev)) * 100 : null
    }

    // ── Enhanced KPIs (needs statement_section + cost_behavior) ─
    const cogsAmount    = Math.abs(sum(bySection('cogs')))
    const variableCosts = Math.abs(sum(byCostBehavior('variable')))

    const grossProfit    = revenue - cogsAmount
    const grossMargin    = revenue !== 0 ? (grossProfit / revenue) * 100 : null
    const contributionMargin = revenue - variableCosts
    const contributionMarginRatio = revenue !== 0
        ? (contributionMargin / revenue) * 100
        : null

    // ── Balance KPIs (needs balance_asset / balance_liability) ──
    const currentAssets      = sum(bySection('balance_asset'))
    const currentLiabilities = Math.abs(sum(bySection('balance_liability')))
    const liquidityRatio     = currentLiabilities !== 0
        ? currentAssets / currentLiabilities
        : null

    return {
        revenue,
        ebitda,
        netResult,
        cashFlow,
        burnRate,
        monthlyGrowthRate,
        grossProfit,
        grossMargin,
        contributionMargin,
        contributionMarginRatio,
        variableCosts,
        liquidityRatio,
        debtorDays: null,
        _meta: {
            transactionCount: transactions.length,
            period: { from: from ?? null, to: to ?? null },
        },
    }
}