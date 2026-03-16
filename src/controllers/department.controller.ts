import { Request, Response } from 'express'
import { createDepartmentService, getDepartmentsService } from '../services/department.service'
import { validateCreateDepartment } from '../validators/department.validator'

export const createDepartment = async (req: Request, res: Response): Promise<void> => {
    try {
        const { name } = validateCreateDepartment(req.body)
        const data = await createDepartmentService(req.userProfile!.organisations_id, name)
        res.status(201).json({ success: true, data })
    } catch (error) {
        res.status(400).json({ success: false, error: (error as Error).message })
    }
}

export const getDepartments = async (req: Request, res: Response): Promise<void> => {
    try {
        const data = await getDepartmentsService(req.userProfile!.organisations_id)
        res.status(200).json({ success: true, data })
    } catch (error) {
        res.status(400).json({ success: false, error: (error as Error).message })
    }
}