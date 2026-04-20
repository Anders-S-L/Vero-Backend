import { SupportedKpiKey } from '../types'

export type KpiMetadata = {
    definition: string
    calculationExample: string[]
}

const EMPTY_KPI_METADATA: KpiMetadata = {
    definition: '',
    calculationExample: [],
}

export const KPI_METADATA: Partial<Record<SupportedKpiKey, KpiMetadata>> = {
    revenue: {
        definition: '',
        calculationExample: [],
    },
    variableCosts: {
        definition: '',
        calculationExample: [],
    },
    contributionMargin: {
        definition: '',
        calculationExample: [],
    },
    grossProfit: {
        definition: '',
        calculationExample: [],
    },
    monthlyGrowthRate: {
        definition: '',
        calculationExample: [],
    },
    bruttofortjeneste: {
        definition: '',
        calculationExample: [],
    },
    grossMargin: {
        definition: '',
        calculationExample: [],
    },
    ebitda: {
        definition: '',
        calculationExample: [],
    },
    netResult: {
        definition: '',
        calculationExample: [],
    },
    cashFlow: {
        definition: '',
        calculationExample: [],
    },
    liquidityRatio: {
        definition: '',
        calculationExample: [],
    },
    burnRate: {
        definition: '',
        calculationExample: [],
    },
    debtorDays: {
        definition: '',
        calculationExample: [],
    },
}

export const getKpiMetadata = (key: SupportedKpiKey): KpiMetadata => {
    const metadata = KPI_METADATA[key]

    return {
        definition: metadata?.definition ?? EMPTY_KPI_METADATA.definition,
        calculationExample: metadata?.calculationExample ?? EMPTY_KPI_METADATA.calculationExample,
    }
}
