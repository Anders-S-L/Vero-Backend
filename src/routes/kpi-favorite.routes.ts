import { Router } from 'express'
import { getKpiFavoritesController, replaceKpiFavoritesController } from '../controllers/kpi-favorite.controller'
import { requireActiveProfile, requireAuth } from '../middleware/access.middleware'

const kpiFavoriteRouter = Router()

// Henter den loggede brugers KPI-favoritter i organisationen.
kpiFavoriteRouter.get('/', requireAuth, requireActiveProfile, getKpiFavoritesController)
// Erstatter den loggede brugers KPI-favoritter i organisationen.
kpiFavoriteRouter.put('/', requireAuth, requireActiveProfile, replaceKpiFavoritesController)

export default kpiFavoriteRouter
