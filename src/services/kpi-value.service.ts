import { supabaseAdmin } from '../lib/supabase'
import { calculateInclusiveDays, calculateKpis, shiftDateByDays } from './kpi.service'
import { getTrackedKpis } from './organisation-kpi.service'
import { KpiResult, KpiValue, SupportedKpiKey, Transaction } from '../types'
// Håndtere det gemte KPI-resultat over tid, inklusive genberegning og historik.
const getMonthBounds = (date: string) => {
    const parsed = new Date(`${date}T00:00:00Z`)
    const year = parsed.getUTCFullYear()
    const month = parsed.getUTCMonth()
    const start = new Date(Date.UTC(year, month, 1))
    const end = new Date(Date.UTC(year, month + 1, 0))

    return {
        from: start.toISOString().slice(0, 10),
        to: end.toISOString().slice(0, 10),
    }
}

const getMonthStartsBetween = (from: string, to: string) => {
    const result: string[] = []
    const current = new Date(`${from}T00:00:00Z`)
    current.setUTCDate(1)
    const end = new Date(`${to}T00:00:00Z`)
    end.setUTCDate(1)

    while (current.getTime() <= end.getTime()) {
        result.push(current.toISOString().slice(0, 10))
        current.setUTCMonth(current.getUTCMonth() + 1)
    }

    return result
}

const getTransactionsForKpiWindow = async (
    organisationId: string,
    from: string,
    to: string,
): Promise<Transaction[]> => {
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

    if (error) throw new Error('Kunne ikke hente transaktioner til KPI-gemning.')

    return (data ?? []).map((transaction) => ({
        ...transaction,
        category: Array.isArray(transaction.category) ? transaction.category[0] ?? null : transaction.category,
    })) as Transaction[]
}

const buildUpsertRows = (
    organisationId: string,
    from: string,
    to: string,
    trackedKeys: SupportedKpiKey[],
    result: KpiResult,
) => {
    const calculatedAt = new Date().toISOString()

    return trackedKeys.map((key) => {
        const metric = result.metrics[key]
        return {
            organisations_id: organisationId,
            department_id: null,
            kpi_key: key,
            period_type: 'month',
            period_start: from,
            period_end: to,
            value: metric.value,
            unit: metric.unit,
            available: metric.available,
            reason: metric.reason ?? null,
            source_transaction_count: result.transactionCount,
            calculated_at: calculatedAt,
            updated_at: calculatedAt,
        }
    })
}

export const recalculateMonthlyKpis = async (organisationId: string, date: string): Promise<KpiValue[]> => {
    const trackedKpis = await getTrackedKpis(organisationId)
    if (trackedKpis.length === 0) return []

    const trackedKeys = trackedKpis.map((kpi) => kpi.key)
    const { from, to } = getMonthBounds(date)
    const periodDays = calculateInclusiveDays(from, to)
    const comparisonFrom = shiftDateByDays(from, -periodDays)
    const transactions = await getTransactionsForKpiWindow(organisationId, comparisonFrom, to)
    const result = calculateKpis(transactions, from, to)
    const rows = buildUpsertRows(organisationId, from, to, trackedKeys, result)

    const { data, error } = await supabaseAdmin
        .from('kpi_values')
        .upsert(rows, {
            onConflict: 'organisations_id,kpi_key,period_type,period_start,period_end',
        })
        .select(
            'id, organisations_id, department_id, kpi_key, period_type, period_start, period_end, value, unit, available, reason, source_transaction_count, calculated_at, created_at, updated_at',
        )

    if (error) throw new Error('Kunne ikke gemme KPI-værdier.')
    return (data ?? []) as KpiValue[]
}

export const recalculateKpiRange = async (organisationId: string, from: string, to: string) => {
    const monthStarts = getMonthStartsBetween(from, to)
    const values: KpiValue[] = []

    for (const monthStart of monthStarts) {
        const monthValues = await recalculateMonthlyKpis(organisationId, monthStart)
        values.push(...monthValues)
    }

    return values
}

export const getKpiHistory = async (
    organisationId: string,
    kpiKey: SupportedKpiKey,
    from: string,
    to: string,
): Promise<KpiValue[]> => {
    const { data, error } = await supabaseAdmin
        .from('kpi_values')
        .select(
            'id, organisations_id, department_id, kpi_key, period_type, period_start, period_end, value, unit, available, reason, source_transaction_count, calculated_at, created_at, updated_at',
        )
        .eq('organisations_id', organisationId)
        .eq('period_type', 'month')
        .eq('kpi_key', kpiKey)
        .gte('period_start', from)
        .lte('period_start', to)
        .order('period_start', { ascending: true })

    if (error) throw new Error('Kunne ikke hente KPI-historik.')
    return (data ?? []) as KpiValue[]
}
