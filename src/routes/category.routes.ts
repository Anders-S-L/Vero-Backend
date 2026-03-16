import { Router } from 'express'
import { createCategory, getCategories } from '../controllers/category.controller'
import { requireAuth, requireAdmin } from '../middleware/access.middleware'
import { validateCreateCategoryMiddleware } from '../middleware/category.middleware'

const categoryRouter = Router()

categoryRouter.post('/', requireAuth, requireAdmin, validateCreateCategoryMiddleware, createCategory)
categoryRouter.get('/', requireAuth, requireAdmin, getCategories)

export default categoryRouter