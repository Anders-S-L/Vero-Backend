const COST_BEHAVIORS = ['variable', 'fixed'] as const

export const validateCostBehavior = (costBehavior?: string | null) => {
    const normalized = costBehavior?.trim() || null
    if (normalized && !COST_BEHAVIORS.includes(normalized as (typeof COST_BEHAVIORS)[number])) {
        throw new Error('Omkostningsadfaerd skal vaere variable eller fixed.')
    }
    return normalized
}

export const validateCreateTransaction = (body: unknown) => {
    const { amount, date, category_id, description, cost_behavior, repeat_monthly, repeat_until } = body as {
        amount?: number
        date?: string
        category_id?: string
        description?: string
        cost_behavior?: string | null
        repeat_monthly?: boolean
        repeat_until?: string
    }
    if (!amount || isNaN(amount)) throw new Error('Beloeb er paakraevet.')
    if (!date) throw new Error('Dato er paakraevet.')
    if (!category_id) throw new Error('Kategori er paakraevet.')
    if (!description || description.trim().length < 2) throw new Error('Beskrivelse er paakraevet.')
    if (repeat_monthly && !repeat_until) throw new Error('repeat_until er paakraevet naar repeat_monthly er true.')
    if (repeat_until) {
        const repeatUntilDate = new Date(repeat_until)
        const transactionDate = new Date(date)
        if (isNaN(repeatUntilDate.getTime())) throw new Error('repeat_until skal vaere en gyldig dato.')
        if (repeatUntilDate < transactionDate) throw new Error('repeat_until skal vaere samme dag eller efter dato.')
    }

    return {
        amount,
        date,
        category_id,
        description: description || null,
        cost_behavior: validateCostBehavior(cost_behavior),
        repeat_monthly: Boolean(repeat_monthly),
        repeat_until: repeat_until || null,
    }
}
