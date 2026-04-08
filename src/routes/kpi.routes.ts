import { Router } from 'express'
import {
    getAvailableKpisController,
    getKpiHistoryController,
    getKpisController,
    getTrackedKpisController,
    rebuildKpisController,
    replaceTrackedKpisController,
} from '../controllers/kpi.controller'
import { requireAuth, requireAdmin } from '../middleware/access.middleware'

const kpiRouter = Router()

// Henter listen over KPIer, backenden understøtter.
kpiRouter.get('/available', requireAuth, requireAdmin, getAvailableKpisController)
// Henter de KPIer organisationen aktuelt følger.
kpiRouter.get('/tracked', requireAuth, requireAdmin, getTrackedKpisController)
// Erstatter organisationens valgte KPIer.
kpiRouter.put('/tracked', requireAuth, requireAdmin, replaceTrackedKpisController)
// Henter historiske KPI-værdier for én KPI over tid.
kpiRouter.get('/history', requireAuth, requireAdmin, getKpiHistoryController)
// Genberegner og gemmer månedlige KPI-værdier for et datointerval.
kpiRouter.post('/rebuild', requireAuth, requireAdmin, rebuildKpisController)
// Henter KPI'er for en valgt periode for den organisation, den loggede admin tilhører.
kpiRouter.get('/', requireAuth, requireAdmin, getKpisController)

export default kpiRouter
