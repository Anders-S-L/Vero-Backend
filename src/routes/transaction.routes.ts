import { Router } from 'express'
import { createTransactionController, getTransactionsController, updateTransactionController, deleteTransactionController } from '../controllers/transaction.controller'
import { requireActiveProfile, requireAuth, requireManager } from '../middleware/access.middleware'

const transactionRouter = Router()

transactionRouter.get('/', requireAuth, requireActiveProfile, getTransactionsController)
transactionRouter.post('/', requireAuth, requireActiveProfile, createTransactionController)
transactionRouter.put('/:id', requireAuth, requireManager, updateTransactionController)
transactionRouter.delete('/:id', requireAuth, requireManager, deleteTransactionController)

export default transactionRouter
