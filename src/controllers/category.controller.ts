import { Request, Response } from 'express'
import { createCategoryService, deleteCategoryService, getCategoriesService, updateCategoryService } from '../services/category.service'

export const createCategory = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, type, department_id, cost_behavior } = req.body as {
            name: string
            type: string
            department_id: string
            cost_behavior: string | null
        }
        const data = await createCategoryService(req.userProfile!, department_id, name, type, cost_behavior)
        res.status(201).json({ success: true, data })
    } catch (error) {
        res.status(400).json({ success: false, error: (error as Error).message })
    }
}

export const getCategories = async (req: Request, res: Response): Promise<void> => {
    try {
        const departmentId = req.query.department_id as string | undefined
        const data = await getCategoriesService(req.userProfile!, departmentId)
        res.status(200).json({ success: true, data })
    } catch (error) {
        res.status(400).json({ success: false, error: (error as Error).message })
    }
}

export const updateCategory = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params
        const { name, type, cost_behavior } = req.body as {
            name: string
            type: string
            cost_behavior: string | null
        }
        const data = await updateCategoryService(req.userProfile!, id, name, type, cost_behavior)
        res.status(200).json({ success: true, data })
    } catch (error) {
        res.status(400).json({ success: false, error: (error as Error).message })
    }
}

export const deleteCategory = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params
        await deleteCategoryService(req.userProfile!, id)
        res.status(200).json({ success: true })
    } catch (error) {
        res.status(400).json({ success: false, error: (error as Error).message })
    }
}
