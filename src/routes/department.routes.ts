import { Router } from 'express'
import { createDepartment, getDepartments } from '../controllers/department.controller'
import { requireAuth, requireAdmin } from '../middleware/access.middleware'

const departmentRouter = Router()

departmentRouter.post('/', requireAuth, requireAdmin, createDepartment)
departmentRouter.get('/', requireAuth, requireAdmin, getDepartments)

export default departmentRouter
