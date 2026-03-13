import { Router } from 'express'
import { login, registerOwner } from '../controllers/auth.controller'
import { validateLoginMiddleware, validateRegisterOwnerMiddleware } from '../middleware/auth.middleware'

const authRouter = Router()

authRouter.post('/register-owner', validateRegisterOwnerMiddleware, registerOwner)
authRouter.post('/login', validateLoginMiddleware, login)

export default authRouter