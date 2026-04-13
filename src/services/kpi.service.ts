import { KpiMetric, KpiResult, SupportedKpiKey, Transaction } from '../types'
// udregner KPIér ud fra transaktioner
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
    debtorDays: { name: 'Debitor­dage', unit: 'days' },
}

// Normaliserer kategori-typen, så sammenligninger ikke afhænger af whitespace eller store bogstaver.
const normalizeCategoryType = (value?: string | null) => {
    return (value ?? '').trim().toLowerCase()
}

// Summerer alle transaktioner, hvor den joinede kategori matcher en eller flere ønskede typer.
const sumByCategoryTypes = (transactions: Transaction[], categoryTypes: string[]) => {
    const expected = new Set(categoryTypes)

    return transactions.reduce((sum, transaction) => {
        const normalizedType = normalizeCategoryType(transaction.category?.type)
        if (!expected.has(normalizedType)) return sum
        return sum + Number(transaction.amount)
    }, 0)
}

// Ensartet struktur for alle KPI-metrics i API-responsen.
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

// Periodens længde bruges både til burn rate og til at finde sammenligningsperioden.
export const calculateInclusiveDays = (from: string, to: string) => {
    const fromDate = new Date(`${from}T00:00:00Z`)
    const toDate = new Date(`${to}T00:00:00Z`)
    const millisecondsPerDay = 1000 * 60 * 60 * 24

    return Math.floor((toDate.getTime() - fromDate.getTime()) / millisecondsPerDay) + 1
}

// Flytter en ISO-dato et antal dage frem eller tilbage uden at ændre formatet.
export const shiftDateByDays = (date: string, days: number) => {
    const shifted = new Date(`${date}T00:00:00Z`)
    shifted.setUTCDate(shifted.getUTCDate() + days)
    return shifted.toISOString().slice(0, 10)
}

export const calculateKpis = (transactions: Transaction[], from: string, to: string): KpiResult => {
    const currentPeriodTransactions = transactions.filter((transaction) => transaction.date >= from && transaction.date <= to)
    // Grundtal ud fra de kategori-typer, datamodellen understøtter lige nu.
    const revenue = sumByCategoryTypes(currentPeriodTransactions, ['income'])
    const operatingExpenses = sumByCategoryTypes(currentPeriodTransactions, ['expense'])
    const taxes = sumByCategoryTypes(currentPeriodTransactions, ['tax'])
    const depreciation = sumByCategoryTypes(currentPeriodTransactions, ['depreciation'])
    const totalExpenses = operatingExpenses + taxes + depreciation
    const cashInflows = revenue
    const cashOutflows = operatingExpenses + taxes
    const periodDays = calculateInclusiveDays(from, to)
    const burnRate = periodDays > 0 ? (cashOutflows / periodDays) * 30.4375 : null
    const previousFrom = shiftDateByDays(from, -periodDays)
    const previousTo = shiftDateByDays(from, -1)
    const previousPeriodTransactions = transactions.filter(
        (transaction) => transaction.date >= previousFrom && transaction.date <= previousTo,
    )
    const previousRevenue = sumByCategoryTypes(
        previousPeriodTransactions,
        ['income'],
    )
    const currentRevenue = sumByCategoryTypes(currentPeriodTransactions, ['income'])
    // Sammenligner omsætningen med perioden umiddelbart før med samme længde.
    const monthlyGrowthRate =
        previousRevenue === 0
            ? null
            : ((currentRevenue - previousRevenue) / previousRevenue) * 100

    // De følgende KPI'er kan ikke beregnes korrekt endnu, fordi databasen ikke skelner COGS/variable costs ud.
    const unavailableVariableCostReason = 'Kræver en særskilt kategori for variable costs eller COGS/vareforbrug, som datamodellen ikke har endnu.'
    const unavailableZeroRevenueReason = 'Kan ikke beregnes når omsætning er 0 i perioden.'

    const grossMargin =
        revenue === 0
            ? buildMetric('Bruttomargin (%)', 'percentage', null, false, unavailableZeroRevenueReason)
            : buildMetric('Bruttomargin (%)', 'percentage', null, false, unavailableVariableCostReason)

    return {
        period: { from, to },
        metrics: {
            // KPI'er der kan beregnes korrekt med nuværende kategori-typer.
            revenue: buildMetric('Omsætning', 'currency', revenue, true),
            variableCosts: buildMetric('Variable Costs', 'currency', null, false, unavailableVariableCostReason),
            contributionMargin: buildMetric('Contribution Margin', 'currency', null, false, unavailableVariableCostReason),
            grossProfit: buildMetric('Gross Profit', 'currency', null, false, unavailableVariableCostReason),
            monthlyGrowthRate: buildMetric(
                'Monthly Growth Rate',
                'percentage',
                monthlyGrowthRate,
                monthlyGrowthRate !== null,
                monthlyGrowthRate === null ? 'Kræver omsætning i den foregående sammenligningsperiode.' : undefined,
            ),
            bruttofortjeneste: buildMetric('Bruttofortjeneste', 'currency', null, false, unavailableVariableCostReason),
            grossMargin,
            ebitda: buildMetric('EBITDA', 'currency', revenue - operatingExpenses, true),
            netResult: buildMetric('Nettoresultat', 'currency', revenue - totalExpenses, true),
            cashFlow: buildMetric('Cash Flow', 'currency', cashInflows - cashOutflows, true),
            // Balancebaserede KPI'er kræver data, som endnu ikke findes i modellen.
            liquidityRatio: buildMetric(
                'Likviditetsgrad',
                'ratio',
                null,
                false,
                'Kræver balance-data for omsætningsaktiver og kortfristet gæld, ikke kun transaktioner.',
            ),
            burnRate: buildMetric(
                'Burn Rate',
                'currency',
                burnRate,
                true,
                'Beregnet som månedliggjorte kontante udgifter i perioden. Afskrivninger indgår ikke.',
            ),
            debtorDays: buildMetric(
                'Debitor­dage',
                'days',
                null,
                false,
                'Kræver saldo på tilgodehavender ved periodens slutning, ikke kun transaktioner.',
            ),
        },
        // Gør det tydeligt for frontend og andre udviklere, hvilke faglige antagelser beregningen bygger på.
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
