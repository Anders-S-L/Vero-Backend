import { Request, Response } from 'express'
import { calculateKPIs } from '../services/kpi.service'

export const getKPIs = async (req: Request, res: Response): Promise<void> => {
    try {
        const organisationsId = req.userProfile?.organisations_id
        if (!organisationsId) {
            res.status(403).json({ success: false, error: 'Ingen organisationskontekst.' })
            return
        }

        const { from, to } = req.query as { from?: string; to?: string }
        const kpis = await calculateKPIs(organisationsId, from, to)

        res.json({ success: true, data: kpis })
    } catch (err: any) {
        res.status(500).json({ success: false, error: err.message })
    }
}