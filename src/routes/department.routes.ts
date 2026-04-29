import { Router } from 'express'
import { createDepartment, deleteDepartment, getDepartments, updateDepartment } from '../controllers/department.controller'
import { requireActiveProfile, requireAuth, requireAdmin } from '../middleware/access.middleware'

const departmentRouter = Router()

departmentRouter.post('/', requireAuth, requireAdmin, createDepartment)
departmentRouter.get('/', requireAuth, requireActiveProfile, getDepartments)
departmentRouter.put('/:id', requireAuth, requireAdmin, updateDepartment)
departmentRouter.delete('/:id', requireAuth, requireAdmin, deleteDepartment)

export default departmentRouter
