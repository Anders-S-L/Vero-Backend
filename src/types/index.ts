export type RegisterOwnerRequest = {
    email: string
    password: string
    fullName: string
    organisationName: string
    cvr?: string
    currency: string
    fiscalYearStart: number
}

export type OrganisationInsert = {
    name: string
    CVR?: string
    currency: string
    fiscal_year_start: number
}

export type RegisterOwnerResult = {
    userId: string
    organizationId: string
    role: 'admin'
}

export type LoginRequest = {
    email: string
    password: string
}

export type TransactionCategory = {
    id: string
    name: string
    type: string
}

// Transaction bruges i KPI-flowet med en joinet kategori, så beregningen kan læse category.type.
export type Transaction = {
    id: string
    organisations_id: string
    category_id: string
    amount: number | string
    date: string
    description: string | null
    created_at: string
    category?: TransactionCategory | null
}

// Alle KPI'er returneres med samme struktur, også når de ikke kan beregnes endnu.
export type KpiMetric = {
    label: string
    value: number | null
    unit: 'currency' | 'percentage' | 'days' | 'ratio'
    available: boolean
    reason?: string
}

// Samlet response-model for GET /api/kpis.
export type KpiResult = {
    period: {
        from: string
        to: string
    }
    metrics: {
        revenue: KpiMetric
        variableCosts: KpiMetric
        contributionMargin: KpiMetric
        grossProfit: KpiMetric
        monthlyGrowthRate: KpiMetric
        bruttofortjeneste: KpiMetric
        grossMargin: KpiMetric
        ebitda: KpiMetric
        netResult: KpiMetric
        cashFlow: KpiMetric
        liquidityRatio: KpiMetric
        burnRate: KpiMetric
        debtorDays: KpiMetric
    }
    assumptions: string[]
    transactionCount: number
}
