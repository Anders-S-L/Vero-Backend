import { KPI_DEFINITIONS } from '../services/kpi.service'
import { SupportedKpiKey } from '../types'

export const validateKpiQuery = (query: unknown) => {
    const { from, to } = query as {
        from?: string
        to?: string
    }

    // KPI-endpointet kræver altid en eksplicit periode, så beregninger og sammenligninger er entydige.
    if (!from) throw new Error('Query parameter from er påkrævet.')
    if (!to) throw new Error('Query parameter to er påkrævet.')
    if (Number.isNaN(Date.parse(from))) throw new Error('from skal være en gyldig dato.')
    if (Number.isNaN(Date.parse(to))) throw new Error('to skal være en gyldig dato.')
    if (new Date(from).getTime() > new Date(to).getTime()) {
        throw new Error('from må ikke være senere end to.')
    }

    return { from, to }
}

export const validateTrackedKpisBody = (body: unknown) => {
    const { kpiKeys } = body as {
        kpiKeys?: string[]
    }

    if (!Array.isArray(kpiKeys)) throw new Error('kpiKeys skal være en liste.')

    const allowedKeys = new Set(Object.keys(KPI_DEFINITIONS))
    const uniqueKeys = [...new Set(kpiKeys)]

    if (uniqueKeys.some((key) => !allowedKeys.has(key))) {
        throw new Error('En eller flere KPI-nøgler er ugyldige.')
    }

    return { kpiKeys: uniqueKeys as SupportedKpiKey[] }
}

export const validateKpiHistoryQuery = (query: unknown) => {
    const { from, to } = validateKpiQuery(query)
    const { kpiKey } = query as {
        kpiKey?: string
    }

    if (!kpiKey) throw new Error('Query parameter kpiKey er påkrævet.')
    if (!(kpiKey in KPI_DEFINITIONS)) throw new Error('kpiKey er ugyldig.')

    return { from, to, kpiKey: kpiKey as SupportedKpiKey }
}
