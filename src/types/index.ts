export type RegisterOwnerRequest = {
    email: string
    password: string
    fullName: string
    organizationName: string
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