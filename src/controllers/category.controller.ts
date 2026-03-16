import { Request, Response } from 'express'
import { createCategoryService, getCategoriesService } from '../services/category.service'

export const createCategory = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name, type, department_id } = req.body as {
            name: string
            type: string
            department_id: string
        }
        const data = await createCategoryService(req.userProfile!.organisations_id, department_id, name, type)
        res.status(201).json({ success: true, data })
    } catch (error) {
        res.status(400).json({ success: false, error: (error as Error).message })
    }
}

export const getCategories = async (req: Request, res: Response): Promise<void> => {
    try {
        const departmentId = req.query.department_id as string | undefined
        const data = await getCategoriesService(req.userProfile!.organisations_id, departmentId)
        res.status(200).json({ success: true, data })
    } catch (error) {
        res.status(400).json({ success: false, error: (error as Error).message })
    }
}