import { Router } from 'express'
import { getKpisController } from '../controllers/kpi.controller'
import { requireAuth, requireAdmin } from '../middleware/access.middleware'

const kpiRouter = Router()

// Henter KPI'er for en valgt periode for den organisation, den loggede admin tilhører.
kpiRouter.get('/', requireAuth, requireAdmin, getKpisController)

export default kpiRouter
