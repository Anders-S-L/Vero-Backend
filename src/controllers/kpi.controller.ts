import { Request, Response } from 'express'
import { calculateKpis } from '../services/kpi.service'
import { getTransactionsForKpi } from '../services/transaction.service'
import { validateKpiQuery } from '../validators/kpi.validator'

const calculateInclusiveDays = (from: string, to: string) => {
    const fromDate = new Date(`${from}T00:00:00Z`)
    const toDate = new Date(`${to}T00:00:00Z`)
    const millisecondsPerDay = 1000 * 60 * 60 * 24


    return Math.floor((toDate.getTime() - fromDate.getTime()) / millisecondsPerDay) + 1
}

const shiftDateByDays = (date: string, days: number) => {
    const shifted = new Date(`${date}T00:00:00Z`)
    shifted.setUTCDate(shifted.getUTCDate() + days)
    return shifted.toISOString().slice(0, 10)
}

export const getKpisController = async (req: Request, res: Response): Promise<void> => {
    try {
        const { from, to } = validateKpiQuery(req.query)
        const comparisonDays = calculateInclusiveDays(from, to)
        const queryFrom = shiftDateByDays(from, -comparisonDays)
        const transactions = await getTransactionsForKpi(req.userProfile!.organisations_id, queryFrom, to)
        const data = calculateKpis(transactions, from, to)

        res.status(200).json({ success: true, data })
    } catch (error) {
        res.status(400).json({ success: false, error: (error as Error).message })
    }
}
