import { Router } from 'express'
import { createTransactionController, getTransactionsController, updateTransactionController, deleteTransactionController } from '../controllers/transaction.controller'
import { requireAuth, requireAdmin } from '../middleware/access.middleware'

const transactionRouter = Router()

transactionRouter.get('/', requireAuth, requireAdmin, getTransactionsController)
transactionRouter.post('/', requireAuth, requireAdmin, createTransactionController)
transactionRouter.put('/:id', requireAuth, requireAdmin, updateTransactionController)
transactionRouter.delete('/:id', requireAuth, requireAdmin, deleteTransactionController)

export default transactionRouter