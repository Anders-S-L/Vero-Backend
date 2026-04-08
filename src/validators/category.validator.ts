const VALID_STATEMENT_SECTIONS = [
    'revenue', 'cogs', 'opex', 'depreciation', 'tax', 'balance_asset', 'balance_liability'
] as const

const VALID_COST_BEHAVIORS = ['variable', 'fixed', 'mixed'] as const

export const validateCreateCategory = (body: unknown) => {
    const { name, type, department_id, statement_section, cost_behavior, is_cash } = body as {
        name?: string
        type?: string
        department_id?: string
        statement_section?: string
        cost_behavior?: string
        is_cash?: boolean
    }

    if (!name || name.trim().length < 2) throw new Error('Navn skal være mindst 2 tegn.')
    if (!type || type.trim().length < 1) throw new Error('Type er påkrævet.')
    if (!department_id) throw new Error('Department er påkrævet.')

    if (statement_section && !VALID_STATEMENT_SECTIONS.includes(statement_section as any)) {
        throw new Error(`statement_section skal være en af: ${VALID_STATEMENT_SECTIONS.join(', ')}`)
    }

    if (cost_behavior && !VALID_COST_BEHAVIORS.includes(cost_behavior as any)) {
        throw new Error(`cost_behavior skal være en af: ${VALID_COST_BEHAVIORS.join(', ')}`)
    }

    if (is_cash !== undefined && typeof is_cash !== 'boolean') {
        throw new Error('is_cash skal være true eller false.')
    }

    return {
        name: name.trim(),
        type: type.trim(),
        department_id,
        statement_section: statement_section ?? null,
        cost_behavior: cost_behavior ?? null,
        is_cash: is_cash ?? true,
    }
}