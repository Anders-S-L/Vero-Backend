import { Request, Response } from 'express'
import { createTransaction, getTransactions, updateTransaction, deleteTransaction } from '../services/transaction.service'
import { validateCostBehavior, validateCreateTransaction } from '../validators/transaction.validator'

export const createTransactionController = async (req: Request, res: Response): Promise<void> => {
    try {
        const { amount, date, category_id, description, cost_behavior, repeat_monthly, repeat_until } = validateCreateTransaction(req.body)
        const data = await createTransaction(req.userProfile!, amount, date, category_id, description, cost_behavior, repeat_monthly, repeat_until)
        res.status(201).json({ success: true, data })
    } catch (error) {
        res.status(400).json({ success: false, error: (error as Error).message })
    }
}

export const getTransactionsController = async (req: Request, res: Response): Promise<void> => {
    try {
        const data = await getTransactions(req.userProfile!)
        res.status(200).json({ success: true, data })
    } catch (error) {
        res.status(400).json({ success: false, error: (error as Error).message })
    }
}

export const updateTransactionController = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params
        const { amount, date, description, cost_behavior } = req.body
        const data = await updateTransaction(req.userProfile!, id, amount, date, description || null, validateCostBehavior(cost_behavior))
        res.status(200).json({ success: true, data })
    } catch (error) {
        res.status(400).json({ success: false, error: (error as Error).message })
    }
}

export const deleteTransactionController = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params
        await deleteTransaction(req.userProfile!, id)
        res.status(200).json({ success: true })
    } catch (error) {
        res.status(400).json({ success: false, error: (error as Error).message })
    }
}
