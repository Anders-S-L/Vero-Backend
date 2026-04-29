import { Router } from 'express'
import { getProfiles } from '../controllers/profile.controller'
import { requireAuth, requireManager } from '../middleware/access.middleware'

const profileRouter = Router()

profileRouter.get('/', requireAuth, requireManager, getProfiles)

export default profileRouter
