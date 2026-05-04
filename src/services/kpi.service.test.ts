import test from 'node:test'
import assert from 'node:assert/strict'
import { calculateKpis } from './kpi.service'
import { Transaction } from '../types'

const transaction = (
    id: string,
    amount: number,
    date: string,
    categoryType: string,
): Transaction => ({
    id,
    organisations_id: 'org-1',
    category_id: `cat-${id}`,
    amount,
    date,
    description: null,
    created_at: '2026-04-08T00:00:00.000Z',
    category: {
        id: `cat-${id}`,
        name: categoryType,
        type: categoryType,
        statement_section: null,
        cost_behavior: null,
        is_cash: true,
    },
})

test('calculateKpis computes supported metrics from transaction data', () => {
    const result = calculateKpis(
        [
            transaction('prev-income', 1000, '2026-03-01', 'income'),
            transaction('income', 1500, '2026-03-02', 'income'),
            transaction('expense', -400, '2026-03-03', 'expense'),
            transaction('tax', -100, '2026-03-04', 'tax'),
            transaction('depreciation', -50, '2026-03-05', 'depreciation'),
        ],
        '2026-03-02',
        '2026-03-05',
    )

    assert.equal(result.metrics.revenue.value, 1500)
    assert.equal(result.metrics.ebitda.value, 1100)
    assert.equal(result.metrics.netResult.value, 950)
    assert.equal(result.metrics.cashFlow.value, 1000)
    assert.equal(result.metrics.monthlyGrowthRate.value, 50)
    assert.equal(result.metrics.monthlyGrowthRate.available, true)
    assert.ok(result.metrics.burnRate.value !== null)
    assert.ok(Math.abs(result.metrics.burnRate.value - 3804.6875) < 1e-9)
    assert.match(result.metrics.revenue.definition, /samlede indkomst/i)
    assert.ok(result.metrics.revenue.calculationExample.length > 0)
    assert.equal(result.transactionCount, 4)
})

test('calculateKpis marks unsupported metrics as unavailable with reasons', () => {
    const result = calculateKpis(
        [transaction('expense', 400, '2026-03-03', 'expense')],
        '2026-03-02',
        '2026-03-05',
    )

    assert.equal(result.metrics.variableCosts.available, false)
    assert.match(result.metrics.variableCosts.reason ?? '', /variabel omkostningsadfærd/i)
    assert.equal(result.metrics.grossMargin.available, false)
    assert.match(result.metrics.grossMargin.reason ?? '', /cogs/i)
    assert.equal(result.metrics.monthlyGrowthRate.available, false)
    assert.match(result.metrics.monthlyGrowthRate.reason ?? '', /foregående sammenligningsperiode/i)
    assert.match(result.metrics.variableCosts.definition, /cost_behavior/i)
    assert.ok(result.metrics.variableCosts.calculationExample.length > 0)
})
