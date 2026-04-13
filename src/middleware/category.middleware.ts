import { NextFunction, Request, Response } from 'express'
import { validateCreateCategory, validateUpdateCategory } from '../validators/category.validator'

export const validateCreateCategoryMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction,
): void => {
    try {
        req.body = validateCreateCategory(req.body)
        next()
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Ugyldig request body.'
        res.status(400).json({ success: false, error: message })
    }
}

export const validateUpdateCategoryMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction,
): void => {
    try {
        req.body = validateUpdateCategory(req.body)
        next()
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Ugyldig request body.'
        res.status(400).json({ success: false, error: message })
    }
}
