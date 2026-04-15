import { Router } from 'express'
import { getProfiles } from '../controllers/profile.controller'
import { requireAuth } from '../middleware/access.middleware'

const profileRouter = Router()

profileRouter.get('/', requireAuth, getProfiles)

export default profileRouter