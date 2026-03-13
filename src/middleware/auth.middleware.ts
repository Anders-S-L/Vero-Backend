import { NextFunction, Request, Response } from 'express'
import { validateRegisterOwnerInput, validateLoginInput } from '../validators/auth.validator'

export const validateRegisterOwnerMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction,
): void => {
    try {
        req.body = validateRegisterOwnerInput(req.body)
        next()
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Ugyldig request body.'
        res.status(400).json({ success: false, error: message })
    }
}

export const validateLoginMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    try {
        req.body = validateLoginInput(req.body)
        next()
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Ugyldig request body.'
        res.status(400).json({ success: false, error: message })
    }
}