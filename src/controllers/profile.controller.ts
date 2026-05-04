import { Request, Response } from 'express'
import { getOwnProfileService, getProfilesService, updateOwnProfileNameService } from '../services/profile.service'

export const getProfiles = async (req: Request, res: Response): Promise<void> => {
    try {
        const data = await getProfilesService(req.userProfile!)
        res.status(200).json({ success: true, data })
    } catch (error) {
        res.status(400).json({ success: false, error: (error as Error).message })
    }
}

export const getOwnProfile = async (req: Request, res: Response): Promise<void> => {
    try {
        const data = await getOwnProfileService(req.userProfile!)
        res.status(200).json({ success: true, data })
    } catch (error) {
        res.status(400).json({ success: false, error: (error as Error).message })
    }
}

export const updateOwnProfile = async (req: Request, res: Response): Promise<void> => {
    try {
        const fullName = typeof req.body?.fullName === 'string' ? req.body.fullName.trim() : ''

        if (fullName.length < 2) {
            res.status(400).json({ success: false, error: 'Navn skal vaere mindst 2 tegn.' })
            return
        }

        if (fullName.length > 80) {
            res.status(400).json({ success: false, error: 'Navn maa hoejst vaere 80 tegn.' })
            return
        }

        const data = await updateOwnProfileNameService(req.userProfile!, fullName)
        res.status(200).json({ success: true, data })
    } catch (error) {
        res.status(400).json({ success: false, error: (error as Error).message })
    }
}
