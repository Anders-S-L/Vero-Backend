import { Router } from 'express'
import { inviteEmployee, login, registerOwner } from '../controllers/auth.controller'
import { requireAuth } from '../middleware/access.middleware'
import { validateInviteEmployeeMiddleware, validateLoginMiddleware, validateRegisterOwnerMiddleware } from '../middleware/auth.middleware'

const authRouter = Router()

authRouter.post('/register-owner', validateRegisterOwnerMiddleware, registerOwner)
authRouter.post('/invite', requireAuth, validateInviteEmployeeMiddleware, inviteEmployee)
authRouter.post('/login', validateLoginMiddleware, login)

export default authRouter