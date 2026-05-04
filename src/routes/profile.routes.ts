import { Router } from 'express'
import { getOwnProfile, getProfiles, updateOwnProfile } from '../controllers/profile.controller'
import { requireActiveProfile, requireAuth } from '../middleware/access.middleware'

const profileRouter = Router()

profileRouter.get('/me', requireAuth, requireActiveProfile, getOwnProfile)
profileRouter.put('/me', requireAuth, requireActiveProfile, updateOwnProfile)
profileRouter.get('/', requireAuth, requireActiveProfile, getProfiles)

export default profileRouter
