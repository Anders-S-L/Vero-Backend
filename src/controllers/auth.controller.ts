import { Request, Response } from 'express'
import { inviteEmployeeToOrganization, loginWithEmailPassword, registerOwnerWithOrganization } from '../services/auth.service'
export const registerOwner = async (req: Request, res: Response): Promise<void> => {
    try {
        const result = await registerOwnerWithOrganization(req.body)

        res.status(201).json({
            success: true,
            data: result,
        })
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Ukendt fejl under registrering.'

        res.status(400).json({
            success: false,
            error: message,
        })
    }


}

export const inviteEmployee = async (req: Request, res: Response): Promise<void> => {
    try {
        const result = await inviteEmployeeToOrganization(req.user!.id, req.body)

        res.status(201).json({
            success: true,
            data: result,
        })
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Ukendt fejl under invitation.'

        res.status(400).json({
            success: false,
            error: message,
        })
    }
}

export const login = async (req: Request, res: Response): Promise<void> => {
    try {
        const result = await loginWithEmailPassword(req.body)

        res.status(200).json({
            success: true,
            data: result,
        })
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Ukendt fejl under login.'

        res.status(400).json({
            success: false,
            error: message,
        })
    }
}
