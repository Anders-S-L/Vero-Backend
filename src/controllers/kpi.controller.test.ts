import test from 'node:test'
import assert from 'node:assert/strict'
import { KpiResult, Transaction } from '../types'

process.env.SUPABASE_URL = process.env.SUPABASE_URL ?? 'http://localhost:54321'
process.env.SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY ?? 'test-service-role-key'

type KpiRequest = {
    query: { from: string; to: string }
    userProfile: { organisations_id: string }
}

type JsonResponse = {
    statusCode?: number
    body?: unknown
    status: (code: number) => JsonResponse
    json: (body: unknown) => JsonResponse
}

const transaction = (id: string, amount: number, date: string): Transaction => ({
    id,
    organisations_id: 'org-1',
    category_id: `cat-${id}`,
    amount,
    date,
    description: null,
    created_at: '2026-04-08T00:00:00.000Z',
    category: {
        id: `cat-${id}`,
        name: 'income',
        type: 'income',
        statement_section: null,
        cost_behavior: null,
        is_cash: true,
    },
})

const makeResponse = (): JsonResponse => {
    const response: JsonResponse = {
        status(code: number) {
            response.statusCode = code
            return response
        },
        json(body: unknown) {
            response.body = body
            return response
        },
    }

    return response
}

test('getKpisController applies query period to KPI response and current-period metrics', async () => {
    const transactionService = require('../services/transaction.service') as typeof import('../services/transaction.service')
    const controller = require('./kpi.controller') as typeof import('./kpi.controller')
    const originalGetTransactionsForKpi = transactionService.getTransactionsForKpi
    const mutableTransactionService = transactionService as unknown as {
        getTransactionsForKpi: typeof transactionService.getTransactionsForKpi
    }

    const allTransactions = [
        transaction('march-income', 1000, '2026-03-10'),
        transaction('april-income', 2500, '2026-04-10'),
    ]
    const calls: Array<{ organisationId: string; from: string; to: string }> = []

    mutableTransactionService.getTransactionsForKpi = async (organisationId: string, from: string, to: string) => {
        calls.push({ organisationId, from, to })
        return allTransactions.filter((item) => item.date >= from && item.date <= to)
    }

    try {
        const marchResponse = makeResponse()
        await controller.getKpisController(
            {
                query: { from: '2026-03-01', to: '2026-03-31' },
                userProfile: { organisations_id: 'org-1' },
            } as KpiRequest as never,
            marchResponse as never,
        )

        const aprilResponse = makeResponse()
        await controller.getKpisController(
            {
                query: { from: '2026-04-01', to: '2026-04-30' },
                userProfile: { organisations_id: 'org-1' },
            } as KpiRequest as never,
            aprilResponse as never,
        )

        const marchBody = marchResponse.body as { success: boolean; data: KpiResult }
        const aprilBody = aprilResponse.body as { success: boolean; data: KpiResult }

        assert.equal(marchResponse.statusCode, 200)
        assert.equal(aprilResponse.statusCode, 200)
        assert.equal(marchBody.success, true)
        assert.equal(aprilBody.success, true)
        assert.deepEqual(marchBody.data.period, { from: '2026-03-01', to: '2026-03-31' })
        assert.deepEqual(aprilBody.data.period, { from: '2026-04-01', to: '2026-04-30' })
        assert.equal(marchBody.data.metrics.revenue.value, 1000)
        assert.equal(aprilBody.data.metrics.revenue.value, 2500)
        assert.equal(marchBody.data.transactionCount, 1)
        assert.equal(aprilBody.data.transactionCount, 1)
        assert.notEqual(marchBody.data.metrics.revenue.value, aprilBody.data.metrics.revenue.value)
        assert.equal(calls[0]?.organisationId, 'org-1')
        assert.equal(calls[0]?.to, '2026-03-31')
        assert.equal(calls[1]?.organisationId, 'org-1')
        assert.equal(calls[1]?.to, '2026-04-30')
    } finally {
        mutableTransactionService.getTransactionsForKpi = originalGetTransactionsForKpi
    }
})
