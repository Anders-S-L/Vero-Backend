import { KpiMetric, KpiResult, SupportedKpiKey, Transaction } from '../types'

export const KPI_DEFINITIONS: Record<SupportedKpiKey, { name: string; unit: KpiMetric['unit'] }> = {
    revenue: { name: 'Omsætning', unit: 'currency' },
    variableCosts: { name: 'Variable Costs', unit: 'currency' },
    contributionMargin: { name: 'Contribution Margin', unit: 'currency' },
    grossProfit: { name: 'Gross Profit', unit: 'currency' },
    monthlyGrowthRate: { name: 'Monthly Growth Rate', unit: 'percentage' },
    bruttofortjeneste: { name: 'Bruttofortjeneste', unit: 'currency' },
    grossMargin: { name: 'Bruttomargin (%)', unit: 'percentage' },
    ebitda: { name: 'EBITDA', unit: 'currency' },
    netResult: { name: 'Nettoresultat', unit: 'currency' },
    cashFlow: { name: 'Cash Flow', unit: 'currency' },
    liquidityRatio: { name: 'Likviditetsgrad', unit: 'ratio' },
    burnRate: { name: 'Burn Rate', unit: 'currency' },
    debtorDays: { name: 'Debitordage', unit: 'days' },
}

const normalizeCategoryType = (value?: string | null) => {
    return (value ?? '').trim().toLowerCase()
}

const sumByCategoryTypes = (transactions: Transaction[], categoryTypes: string[]) => {
    const expected = new Set(categoryTypes)
    return transactions.reduce((sum, transaction) => {
        const normalizedType = normalizeCategoryType(transaction.category?.type)
        if (!expected.has(normalizedType)) return sum
        return sum + Number(transaction.amount)
    }, 0)
}

const buildMetric = (
    label: string,
    unit: KpiMetric['unit'],
    value: number | null,
    available: boolean,
    reason?: string,
): KpiMetric => ({
    label,
    value,
    unit,
    available,
    reason,
})

export const calculateInclusiveDays = (from: string, to: string) => {
    const fromDate = new Date(`${from}T00:00:00Z`)
    const toDate = new Date(`${to}T00:00:00Z`)
    const millisecondsPerDay = 1000 * 60 * 60 * 24
    return Math.floor((toDate.getTime() - fromDate.getTime()) / millisecondsPerDay) + 1
}

export const shiftDateByDays = (date: string, days: number) => {
    const shifted = new Date(`${date}T00:00:00Z`)
    shifted.setUTCDate(shifted.getUTCDate() + days)
    return shifted.toISOString().slice(0, 10)
}

export const calculateKpis = (transactions: Transaction[], from: string, to: string): KpiResult => {
    const currentPeriodTransactions = transactions.filter(
        (transaction) => transaction.date >= from && transaction.date <= to,
    )

    const revenue = sumByCategoryTypes(currentPeriodTransactions, ['income'])
    const operatingExpenses = sumByCategoryTypes(currentPeriodTransactions, ['expense'])
    const taxes = sumByCategoryTypes(currentPeriodTransactions, ['tax'])
    const depreciation = sumByCategoryTypes(currentPeriodTransactions, ['depreciation'])
    const totalExpenses = operatingExpenses + taxes + depreciation
    const cashInflows = revenue
    const cashOutflows = operatingExpenses + taxes
    const periodDays = calculateInclusiveDays(from, to)
    const burnRate = periodDays > 0 ? Math.abs((cashOutflows / periodDays) * 30.4375) : null

    const previousFrom = shiftDateByDays(from, -periodDays)
    const previousTo = shiftDateByDays(from, -1)
    const previousRevenue = sumByCategoryTypes(
        transactions.filter((t) => t.date >= previousFrom && t.date <= previousTo),
        ['income'],
    )
    const monthlyGrowthRate =
        previousRevenue === 0
            ? null
            : ((revenue - previousRevenue) / previousRevenue) * 100

    const unavailableVariableCostReason = 'Kræver en særskilt kategori for variable costs eller COGS/vareforbrug, som datamodellen ikke har endnu.'
    const unavailableZeroRevenueReason = 'Kan ikke beregnes når omsætning er 0 i perioden.'

    const cogsAmount = currentPeriodTransactions.reduce((sum, t) => {
        if (t.category?.statement_section === 'cogs') return sum + Number(t.amount)
        return sum
    }, 0)

    const variableCostsAmount = currentPeriodTransactions.reduce((sum, t) => {
        if (t.category?.cost_behavior === 'variable') return sum + Number(t.amount)
        return sum
    }, 0)

    const grossProfitValue = revenue - Math.abs(cogsAmount)
    const grossMarginValue = revenue !== 0 ? (grossProfitValue / revenue) * 100 : null
    const contributionMarginValue = revenue - Math.abs(variableCostsAmount)

    const hasCogsData = currentPeriodTransactions.some(t => t.category?.statement_section === 'cogs')
    const hasVariableData = currentPeriodTransactions.some(t => t.category?.cost_behavior === 'variable')

    return {
        period: { from, to },
        metrics: {
            revenue: buildMetric('Omsætning', 'currency', revenue, true),
            variableCosts: buildMetric('Variable Costs', 'currency',
                hasVariableData ? Math.abs(variableCostsAmount) : null,
                hasVariableData,
                !hasVariableData ? unavailableVariableCostReason : undefined
            ),
            contributionMargin: buildMetric('Contribution Margin', 'currency',
                hasVariableData ? contributionMarginValue : null,
                hasVariableData,
                !hasVariableData ? unavailableVariableCostReason : undefined
            ),
            grossProfit: buildMetric('Gross Profit', 'currency',
                hasCogsData ? grossProfitValue : null,
                hasCogsData,
                !hasCogsData ? unavailableVariableCostReason : undefined
            ),
            monthlyGrowthRate: buildMetric(
                'Monthly Growth Rate', 'percentage',
                monthlyGrowthRate,
                monthlyGrowthRate !== null,
                monthlyGrowthRate === null ? 'Kræver omsætning i den foregående sammenligningsperiode.' : undefined,
            ),
            bruttofortjeneste: buildMetric('Bruttofortjeneste', 'currency',
                hasCogsData ? grossProfitValue : null,
                hasCogsData,
                !hasCogsData ? unavailableVariableCostReason : undefined
            ),
            grossMargin: buildMetric('Bruttomargin (%)', 'percentage',
                hasCogsData && revenue !== 0 ? grossMarginValue : null,
                hasCogsData && revenue !== 0,
                !hasCogsData ? unavailableVariableCostReason : revenue === 0 ? unavailableZeroRevenueReason : undefined
            ),
            ebitda: buildMetric('EBITDA', 'currency', revenue - operatingExpenses, true),
            netResult: buildMetric('Nettoresultat', 'currency', revenue - totalExpenses, true),
            cashFlow: buildMetric('Cash Flow', 'currency', cashInflows - cashOutflows, true),
            liquidityRatio: buildMetric(
                'Likviditetsgrad', 'ratio', null, false,
                'Kræver balance-data for omsætningsaktiver og kortfristet gæld, ikke kun transaktioner.',
            ),
            burnRate: buildMetric('Burn Rate', 'currency', burnRate, true,
                'Beregnet som månedliggjorte kontante udgifter i perioden. Afskrivninger indgår ikke.',
            ),
            debtorDays: buildMetric(
                'Debitordage', 'days', null, false,
                'Kræver saldo på tilgodehavender ved periodens slutning, ikke kun transaktioner.',
            ),
        },
        assumptions: [
            'KPIer beregnes ud fra transaktioner i den valgte periode.',
            'Omsætning hentes fra kategorier med type income.',
            'Driftsomkostninger hentes fra kategorier med type expense.',
            'Skat hentes fra kategorier med type tax.',
            'Afskrivninger hentes fra kategorier med type depreciation.',
            'Cash Flow og Burn Rate behandler afskrivninger som ikke-kontante poster.',
            'Monthly Growth Rate sammenligner omsætning med den umiddelbart foregående periode af samme længde.',
        ],
        transactionCount: currentPeriodTransactions.length,
    }
}