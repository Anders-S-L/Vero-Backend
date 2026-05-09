import { Request, Response } from 'express'
import { calculateInclusiveDays, calculateKpis, shiftDateByDays } from '../services/kpi.service'
import { getTransactionsForKpi } from '../services/transaction.service'
import { assertDepartmentAccess } from '../services/category.service'
import { getTransactionDateRange, recalculateKpiRange } from '../services/kpi-value.service'
import { getTrackedKpis, listAvailableKpis, replaceTrackedKpis } from '../services/organisation-kpi.service'
import { validateKpiHistoryQuery, validateKpiQuery, validateTrackedKpisBody } from '../validators/kpi.validator'
import { KpiValue, SupportedKpiKey } from '../types'

type AccessProfile = {
    id: string
    organisations_id: string
    role: 'admin' | 'manager' | 'employee'
}

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

const calculateKpiHistoryForProfile = async (
    profile: AccessProfile,
    kpiKey: SupportedKpiKey,
    from: string,
    to: string,
    departmentId?: string,
): Promise<KpiValue[]> => {
    const rows: KpiValue[] = []
    const monthStarts = getMonthStartsBetween(from, to)

    for (const monthStart of monthStarts) {
        const bounds = getMonthBounds(monthStart)
        const periodDays = calculateInclusiveDays(bounds.from, bounds.to)
        const comparisonFrom = shiftDateByDays(bounds.from, -periodDays)
        const transactions = await getTransactionsForKpi(profile, comparisonFrom, bounds.to, departmentId)
        const result = calculateKpis(transactions, bounds.from, bounds.to)
        const metric = result.metrics[kpiKey]
        const calculatedAt = new Date().toISOString()

        rows.push({
            id: `${profile.organisations_id}-${departmentId ?? 'all'}-${kpiKey}-${bounds.from}`,
            organisations_id: profile.organisations_id,
            department_id: departmentId ?? null,
            kpi_key: kpiKey,
            period_type: 'month',
            period_start: bounds.from,
            period_end: bounds.to,
            value: metric.value,
            unit: metric.unit,
            available: metric.available,
            reason: metric.reason ?? null,
            source_transaction_count: result.transactionCount,
            calculated_at: calculatedAt,
            created_at: calculatedAt,
            updated_at: calculatedAt,
        })
    }

    return rows
}

export const getKpisController = async (req: Request, res: Response): Promise<void> => {
    try {
        const { from, to, department_id } = validateKpiQuery(req.query)
        const comparisonDays = calculateInclusiveDays(from, to)
        const queryFrom = shiftDateByDays(from, -comparisonDays)
        const profile = req.userProfile!

        if (profile.role !== 'admin') {
            if (department_id) await assertDepartmentAccess(profile, department_id)
        }

        const transactions = await getTransactionsForKpi(profile, queryFrom, to, department_id)
        const data = calculateKpis(transactions, from, to)

        res.status(200).json({ success: true, data })
    } catch (error) {
        res.status(400).json({ success: false, error: (error as Error).message })
    }
}

export const getAvailableKpisController = async (_req: Request, res: Response): Promise<void> => {
    try {
        res.status(200).json({ success: true, data: listAvailableKpis() })
    } catch (error) {
        res.status(400).json({ success: false, error: (error as Error).message })
    }
}

export const getTrackedKpisController = async (req: Request, res: Response): Promise<void> => {
    try {
        const data = await getTrackedKpis(req.userProfile!.organisations_id)
        res.status(200).json({ success: true, data })
    } catch (error) {
        res.status(400).json({ success: false, error: (error as Error).message })
    }
}

export const replaceTrackedKpisController = async (req: Request, res: Response): Promise<void> => {
    try {
        const { kpiKeys } = validateTrackedKpisBody(req.body)
        const data = await replaceTrackedKpis(req.userProfile!.organisations_id, kpiKeys)
        res.status(200).json({ success: true, data })
    } catch (error) {
        res.status(400).json({ success: false, error: (error as Error).message })
    }
}

export const getKpiHistoryController = async (req: Request, res: Response): Promise<void> => {
    try {
        const { kpiKey, from, to, department_id } = validateKpiHistoryQuery(req.query)
        const profile = req.userProfile!

        if (profile.role !== 'admin' && department_id) {
            await assertDepartmentAccess(profile, department_id)
        }

        const data = await calculateKpiHistoryForProfile(profile, kpiKey, from, to, department_id)
        res.status(200).json({ success: true, data })
    } catch (error) {
        res.status(400).json({ success: false, error: (error as Error).message })
    }
}

export const rebuildKpisController = async (req: Request, res: Response): Promise<void> => {
    try {
        const organisationId = req.userProfile!.organisations_id
        let from: string
        let to: string

        if (req.body?.from && req.body?.to) {
            const validated = validateKpiQuery(req.body)
            from = validated.from
            to = validated.to
        } else {
            const range = await getTransactionDateRange(organisationId)
            if (!range) {
                res.status(200).json({ success: true, data: [], message: 'Ingen transaktioner fundet.' })
                return
            }
            from = range.from
            to = range.to
        }

        const data = await recalculateKpiRange(organisationId, from, to)
        res.status(200).json({ success: true, data })
    } catch (error) {
        res.status(400).json({ success: false, error: (error as Error).message })
    }
}
