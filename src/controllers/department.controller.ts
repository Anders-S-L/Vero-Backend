import { Request, Response } from 'express'
import { createDepartmentService, deleteDepartmentService, getAccessibleDepartmentsService, updateDepartmentService } from '../services/department.service'
import { validateCreateDepartment, validateUpdateDepartment } from '../validators/department.validator'

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
        const data = await getAccessibleDepartmentsService(req.userProfile!)
        res.status(200).json({ success: true, data })
    } catch (error) {
        res.status(400).json({ success: false, error: (error as Error).message })
    }
}

export const updateDepartment = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params
        const { name } = validateUpdateDepartment(req.body)
        const data = await updateDepartmentService(req.userProfile!.organisations_id, id, name)
        res.status(200).json({ success: true, data })
    } catch (error) {
        res.status(400).json({ success: false, error: (error as Error).message })
    }
}

export const deleteDepartment = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params
        await deleteDepartmentService(req.userProfile!.organisations_id, id)
        res.status(200).json({ success: true })
    } catch (error) {
        res.status(400).json({ success: false, error: (error as Error).message })
    }
}
