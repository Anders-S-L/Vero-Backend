import { Request, Response } from 'express'
import { calculateInclusiveDays, calculateKpis, shiftDateByDays } from '../services/kpi.service'
import { getTransactionsForKpi } from '../services/transaction.service'
import { assertDepartmentAccess } from '../services/category.service'
import { getKpiHistory, getTransactionDateRange, recalculateKpiRange } from '../services/kpi-value.service'
import { getTrackedKpis, listAvailableKpis, replaceTrackedKpis } from '../services/organisation-kpi.service'
import { validateKpiHistoryQuery, validateKpiQuery, validateTrackedKpisBody } from '../validators/kpi.validator'

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
        const { kpiKey, from, to } = validateKpiHistoryQuery(req.query)
        const data = await getKpiHistory(req.userProfile!.organisations_id, kpiKey, from, to)
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
