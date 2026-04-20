import { Request, Response } from 'express'
import { getKpiFavorites, replaceKpiFavorites } from '../services/kpi-favorite.service'
import { validateKpiFavoritesBody } from '../validators/kpi-favorite.validator'

export const getKpiFavoritesController = async (req: Request, res: Response): Promise<void> => {
    try {
        const data = await getKpiFavorites(req.user!.id, req.userProfile!.organisations_id)
        res.status(200).json({ success: true, data })
    } catch (error) {
        res.status(400).json({ success: false, error: (error as Error).message })
    }
}

export const replaceKpiFavoritesController = async (req: Request, res: Response): Promise<void> => {
    try {
        const { favorites } = validateKpiFavoritesBody(req.body)
        const data = await replaceKpiFavorites(req.user!.id, req.userProfile!.organisations_id, favorites)
        res.status(200).json({ success: true, data })
    } catch (error) {
        res.status(400).json({ success: false, error: (error as Error).message })
    }
}
