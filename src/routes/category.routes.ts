import { Router } from 'express'
import { createCategory, deleteCategory, getCategories, updateCategory } from '../controllers/category.controller'
import { requireActiveProfile, requireAuth, requireManager } from '../middleware/access.middleware'
import { validateCreateCategoryMiddleware, validateUpdateCategoryMiddleware } from '../middleware/category.middleware'

const categoryRouter = Router()

categoryRouter.post('/', requireAuth, requireManager, validateCreateCategoryMiddleware, createCategory)
categoryRouter.get('/', requireAuth, requireActiveProfile, getCategories)
categoryRouter.put('/:id', requireAuth, requireManager, validateUpdateCategoryMiddleware, updateCategory)
categoryRouter.delete('/:id', requireAuth, requireManager, deleteCategory)

export default categoryRouter
