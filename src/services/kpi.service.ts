import { KpiMetric, KpiResult, SupportedKpiKey, Transaction } from '../types'
import { getKpiMetadata } from './kpi-metadata.service'

export const KPI_DEFINITIONS: Record<SupportedKpiKey, { name: string; unit: KpiMetric['unit'] }> = {
    revenue: { name: 'Omsætning', unit: 'currency' },
    variableCosts: { name: 'Variable omkostninger', unit: 'currency' },
    contributionMargin: { name: 'Dækningsbidrag', unit: 'currency' },
    grossProfit: { name: 'Bruttofortjeneste', unit: 'currency' },
    monthlyGrowthRate: { name: 'Månedlig vækst', unit: 'percentage' },
    bruttofortjeneste: { name: 'Bruttofortjeneste', unit: 'currency' },
    grossMargin: { name: 'Bruttomargin', unit: 'percentage' },
    ebitda: { name: 'EBITDA', unit: 'currency' },
    netResult: { name: 'Nettoresultat', unit: 'currency' },
    cashFlow: { name: 'Cash Flow', unit: 'currency' },
    liquidityRatio: { name: 'Likviditetsgrad', unit: 'ratio' },
    burnRate: { name: 'Burn Rate', unit: 'currency' },
    debtorDays: { name: 'Debitordage', unit: 'days' },
}

const normalizeCategoryType = (value?: string | null) => (value ?? '').trim().toLowerCase()

// Expenses, taxes and depreciation are stored as NEGATIVE amounts.
// This function sums amounts for matching category types — the sign is preserved.
const sumByCategoryTypes = (transactions: Transaction[], categoryTypes: string[]) => {
    const expected = new Set(categoryTypes)
    return transactions.reduce((sum, t) => {
        if (!expected.has(normalizeCategoryType(t.category?.type))) return sum
        return sum + Number(t.amount)
    }, 0)
}

const buildMetric = (
    key: SupportedKpiKey,
    label: string,
    unit: KpiMetric['unit'],
    value: number | null,
    available: boolean,
    reason?: string,
): KpiMetric => {
    const metadata = getKpiMetadata(key)
    return { label, value, unit, available, reason, definition: metadata.definition, calculationExample: metadata.calculationExample }
}

export const calculateInclusiveDays = (from: string, to: string) => {
    const fromDate = new Date(`${from}T00:00:00Z`)
    const toDate = new Date(`${to}T00:00:00Z`)
    return Math.floor((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)) + 1
}

export const shiftDateByDays = (date: string, days: number) => {
    const shifted = new Date(`${date}T00:00:00Z`)
    shifted.setUTCDate(shifted.getUTCDate() + days)
    return shifted.toISOString().slice(0, 10)
}

export const calculateKpis = (transactions: Transaction[], from: string, to: string): KpiResult => {
    const current = transactions.filter((t) => t.date >= from && t.date <= to)

    // ── Raw sums (expenses/taxes/depreciation are negative amounts) ──────────
    const revenue = sumByCategoryTypes(current, ['income'])             // positive
    const expensesSum = sumByCategoryTypes(current, ['expense'])        // negative
    const taxesSum = sumByCategoryTypes(current, ['tax'])               // negative
    const depreciationSum = sumByCategoryTypes(current, ['depreciation']) // negative

    // ── COGS vs OpEx split ───────────────────────────────────────────────────
    // Vareforbrug = expense transactions tagged with statement_section = 'cogs'
    const cogsSum = current.reduce((s, t) =>
        t.category?.statement_section === 'cogs' ? s + Number(t.amount) : s, 0)

    // ── Variable costs (expense transactions tagged cost_behavior = 'variable') ─
    const variableSum = current.reduce((s, t) =>
        t.category?.cost_behavior === 'variable' && normalizeCategoryType(t.category?.type) === 'expense'
            ? s + Number(t.amount) : s, 0)

    const hasCogsData = current.some((t) => t.category?.statement_section === 'cogs')
    const hasVariableData = current.some(
        (t) => t.category?.cost_behavior === 'variable' && normalizeCategoryType(t.category?.type) === 'expense'
    )

    // ── Core KPI formulas ────────────────────────────────────────────────────
    // Bruttofortjeneste = Omsætning - Vareforbrug
    //   cogsSum is negative → revenue + cogsSum = revenue - |cogs|
    const grossProfitValue = revenue + cogsSum

    // Bruttomargin = Bruttofortjeneste / Omsætning × 100
    const grossMarginValue = revenue !== 0 ? (grossProfitValue / revenue) * 100 : null

    // Dækningsbidrag = Omsætning - Variable omkostninger
    //   variableSum is negative → revenue + variableSum = revenue - |variable|
    const contributionMarginValue = revenue + variableSum

    // EBITDA = Omsætning - Vareforbrug - Driftsomkostninger (excl. afskrivninger, renter, skat)
    //   expensesSum is negative → revenue + expensesSum = revenue - |expenses|
    const ebitdaValue = revenue + expensesSum

    // Nettoresultat = EBITDA - Afskrivninger - Skat
    //   taxesSum and depreciationSum are negative
    const netResultValue = ebitdaValue + taxesSum + depreciationSum

    // Cash Flow (indirekte metode) = Nettoresultat + Afskrivninger (tilbageføres, ikke-kontant)
    //   = revenue + expensesSum + taxesSum
    const cashFlowValue = netResultValue - depreciationSum

    // Burn Rate = månedliggjorte kontante udbetalinger
    //   expensesSum + taxesSum is negative → Math.abs gives positive monthly rate
    const cashOutflowsSum = expensesSum + taxesSum
    const periodDays = calculateInclusiveDays(from, to)
    const burnRateValue = periodDays > 0 ? Math.abs((cashOutflowsSum / periodDays) * 30.4375) : null

    // Månedlig vækst = (nuværende omsætning - foregående) / foregående × 100
    const previousFrom = shiftDateByDays(from, -periodDays)
    const previousTo = shiftDateByDays(from, -1)
    const previousRevenue = sumByCategoryTypes(
        transactions.filter((t) => t.date >= previousFrom && t.date <= previousTo),
        ['income'],
    )
    const monthlyGrowthRate = previousRevenue === 0
        ? null
        : ((revenue - previousRevenue) / previousRevenue) * 100

    const noCogsReason = 'Kræver transaktioner i en kategori med vareforbrug (cogs).'
    const noVariableReason = 'Kræver transaktioner i kategorier markeret med variabel omkostningsadfærd.'
    const noRevenueReason = 'Kan ikke beregnes når omsætning er 0 i perioden.'

    return {
        period: { from, to },
        metrics: {
            revenue: buildMetric('revenue', 'Omsætning', 'currency', revenue, true),

            grossProfit: buildMetric('grossProfit', 'Bruttofortjeneste', 'currency',
                hasCogsData ? grossProfitValue : null, hasCogsData,
                !hasCogsData ? noCogsReason : undefined),

            bruttofortjeneste: buildMetric('bruttofortjeneste', 'Bruttofortjeneste', 'currency',
                hasCogsData ? grossProfitValue : null, hasCogsData,
                !hasCogsData ? noCogsReason : undefined),

            grossMargin: buildMetric('grossMargin', 'Bruttomargin', 'percentage',
                hasCogsData && revenue !== 0 ? grossMarginValue : null,
                hasCogsData && revenue !== 0,
                !hasCogsData ? noCogsReason : revenue === 0 ? noRevenueReason : undefined),

            variableCosts: buildMetric('variableCosts', 'Variable omkostninger', 'currency',
                hasVariableData ? Math.abs(variableSum) : null, hasVariableData,
                !hasVariableData ? noVariableReason : undefined),

            contributionMargin: buildMetric('contributionMargin', 'Dækningsbidrag', 'currency',
                hasVariableData ? contributionMarginValue : null, hasVariableData,
                !hasVariableData ? noVariableReason : undefined),

            ebitda: buildMetric('ebitda', 'EBITDA', 'currency', ebitdaValue, true),

            netResult: buildMetric('netResult', 'Nettoresultat', 'currency', netResultValue, true),

            cashFlow: buildMetric('cashFlow', 'Cash Flow', 'currency', cashFlowValue, true),

            burnRate: buildMetric('burnRate', 'Burn Rate', 'currency', burnRateValue, burnRateValue !== null,
                burnRateValue === null ? 'Kræver en periode med mere end 0 dage.' : undefined),

            monthlyGrowthRate: buildMetric('monthlyGrowthRate', 'Månedlig vækst', 'percentage',
                monthlyGrowthRate, monthlyGrowthRate !== null,
                monthlyGrowthRate === null ? 'Kræver omsætning i den foregående sammenligningsperiode.' : undefined),

            liquidityRatio: buildMetric('liquidityRatio', 'Likviditetsgrad', 'ratio', null, false,
                'Kræver balance-data for omsætningsaktiver og kortfristet gæld.'),

            debtorDays: buildMetric('debtorDays', 'Debitordage', 'days', null, false,
                'Kræver saldo på tilgodehavender ved periodens slutning.'),
        },
        assumptions: [
            'Omsætning: sum af transaktioner med kategoritype "income".',
            'Vareforbrug: transaktioner med statement_section "cogs" (negativt lagret, vises som positivt).',
            'Bruttofortjeneste: Omsætning − Vareforbrug.',
            'EBITDA: Omsætning − Driftsomkostninger (excl. afskrivninger og skat).',
            'Nettoresultat: EBITDA − Afskrivninger − Skat.',
            'Cash Flow (indirekte): Nettoresultat + Afskrivninger (tilbageføres som ikke-kontant post).',
            'Burn Rate: månedliggjorte kontante udbetalinger (excl. afskrivninger).',
            'Månedlig vækst: sammenligner omsætning med foregående periode af samme længde.',
        ],
        transactionCount: current.length,
    }
}
