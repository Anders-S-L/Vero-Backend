import { Router } from 'express'
import { createCategory, deleteCategory, getCategories, updateCategory } from '../controllers/category.controller'
import { requireAuth, requireAdmin } from '../middleware/access.middleware'
import { validateCreateCategoryMiddleware, validateUpdateCategoryMiddleware } from '../middleware/category.middleware'

const categoryRouter = Router()

categoryRouter.post('/', requireAuth, requireAdmin, validateCreateCategoryMiddleware, createCategory)
categoryRouter.get('/', requireAuth, requireAdmin, getCategories)
categoryRouter.put('/:id', requireAuth, requireAdmin, validateUpdateCategoryMiddleware, updateCategory)
categoryRouter.delete('/:id', requireAuth, requireAdmin, deleteCategory)

export default categoryRouter
