import { Request, Response } from 'express'
import { getProfilesService } from '../services/profile.service'

export const getProfiles = async (req: Request, res: Response): Promise<void> => {
    try {
        const data = await getProfilesService(req.userProfile!)
        res.status(200).json({ success: true, data })
    } catch (error) {
        res.status(400).json({ success: false, error: (error as Error).message })
    }
}
