import { Router } from 'express'
import { getKpiFavoritesController, replaceKpiFavoritesController } from '../controllers/kpi-favorite.controller'
import { requireAuth, requireActiveProfile } from '../middleware/access.middleware'

const kpiFavoriteRouter = Router()

kpiFavoriteRouter.get('/', requireAuth, requireActiveProfile, getKpiFavoritesController)
kpiFavoriteRouter.put('/', requireAuth, requireActiveProfile, replaceKpiFavoritesController)

export default kpiFavoriteRouter
