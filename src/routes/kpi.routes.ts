import { Router } from 'express'
import { getKPIs } from '../controllers/kpi.controller'
import { requireAuth, requireAdmin } from '../middleware/access.middleware'

const kpiRouter = Router()

kpiRouter.get('/', requireAuth, requireAdmin, getKPIs)

export default kpiRouter