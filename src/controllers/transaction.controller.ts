import { Request, Response } from 'express'
import { createTransaction, getTransactions, updateTransaction, deleteTransaction } from '../services/transaction.service'
import { validateCreateTransaction } from '../validators/transaction.validator'

export const createTransactionController = async (req: Request, res: Response): Promise<void> => {
    try {
        const { amount, date, category_id, description } = validateCreateTransaction(req.body)
        const data = await createTransaction(req.userProfile!.organisations_id, req.user!.id, amount, date, category_id, description)
        res.status(201).json({ success: true, data })
    } catch (error) {
        res.status(400).json({ success: false, error: (error as Error).message })
    }
}

export const getTransactionsController = async (req: Request, res: Response): Promise<void> => {
    try {
        const data = await getTransactions(req.userProfile!.organisations_id)
        res.status(200).json({ success: true, data })
    } catch (error) {
        res.status(400).json({ success: false, error: (error as Error).message })
    }
}

export const updateTransactionController = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params
        const { amount, date, description } = req.body
        const data = await updateTransaction(req.userProfile!.organisations_id, id, amount, date, description || null)
        res.status(200).json({ success: true, data })
    } catch (error) {
        res.status(400).json({ success: false, error: (error as Error).message })
    }
}

export const deleteTransactionController = async (req: Request, res: Response): Promise<void> => {
    try {
        const { id } = req.params
        await deleteTransaction(req.userProfile!.organisations_id, id)
        res.status(200).json({ success: true })
    } catch (error) {
        res.status(400).json({ success: false, error: (error as Error).message })
    }
}
