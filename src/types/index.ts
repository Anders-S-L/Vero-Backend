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

export type UserRole = 'admin' | 'manager' | 'employee'

export type InviteRole = Exclude<UserRole, 'admin'>

export type InviteEmployeeRequest = {
    email: string
    fullName: string
    role: InviteRole
    departmentId: string
}

export type LoginRequest = {
    email: string
    password: string
}

export type TransactionCategory = {
    id: string
    name: string
    type: string
    statement_section: string | null
    cost_behavior: string | null
    is_cash: boolean
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
    definition: string
    calculationExample: string[]
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

export type SupportedKpiKey = keyof KpiResult['metrics']

export type OrganisationKpi = {
    id: string
    organisations_id: string
    key: SupportedKpiKey
    name: string
    is_active: boolean
    created_at: string
    updated_at: string
}

export type KpiValue = {
    id: string
    organisations_id: string
    department_id: string | null
    kpi_key: SupportedKpiKey
    period_type: 'month'
    period_start: string
    period_end: string
    value: number | null
    unit: KpiMetric['unit']
    available: boolean
    reason: string | null
    source_transaction_count: number
    calculated_at: string
    created_at: string
    updated_at: string
}
