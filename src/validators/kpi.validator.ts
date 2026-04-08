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
