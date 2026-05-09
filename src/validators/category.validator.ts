const CATEGORY_TYPES = ['income', 'expense', 'tax', 'depreciation'] as const
const COST_BEHAVIORS = ['variable', 'fixed'] as const

const normalizeCostBehavior = (type: string, costBehavior?: string | null) => {
    if (type !== 'expense') return null
    const normalized = costBehavior?.trim() || null
    if (normalized && !COST_BEHAVIORS.includes(normalized as (typeof COST_BEHAVIORS)[number])) {
        throw new Error('Omkostningsadfaerd skal vaere variable eller fixed.')
    }
    return normalized
}

export const validateCreateCategory = (body: unknown) => {
    const { name, type, department_id, cost_behavior } = body as {
        name?: string
        type?: string
        department_id?: string
        cost_behavior?: string | null
    }

    if (!name || name.trim().length < 2) throw new Error('Navn skal vaere mindst 2 tegn.')
    if (!type || !CATEGORY_TYPES.includes(type.trim() as (typeof CATEGORY_TYPES)[number])) {
        throw new Error('Type skal vaere income, expense, tax eller depreciation.')
    }
    if (!department_id) throw new Error('Department er paakraevet.')

    const normalizedType = type.trim()
    return {
        name: name.trim(),
        type: normalizedType,
        department_id,
        cost_behavior: normalizeCostBehavior(normalizedType, cost_behavior),
    }
}

export const validateUpdateCategory = (body: unknown) => {
    const { name, type, cost_behavior } = body as {
        name?: string
        type?: string
        cost_behavior?: string | null
    }

    if (!name || name.trim().length < 2) throw new Error('Navn skal vaere mindst 2 tegn.')
    if (!type || !CATEGORY_TYPES.includes(type.trim() as (typeof CATEGORY_TYPES)[number])) {
        throw new Error('Type skal vaere income, expense, tax eller depreciation.')
    }

    const normalizedType = type.trim()
    return {
        name: name.trim(),
        type: normalizedType,
        cost_behavior: normalizeCostBehavior(normalizedType, cost_behavior),
    }
}
