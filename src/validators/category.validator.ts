export const validateCreateCategory = (body: unknown) => {
    const { name, type, department_id } = body as {
        name?: string
        type?: string
        department_id?: string
    }

    if (!name || name.trim().length < 2) throw new Error('Navn skal være mindst 2 tegn.')
    if (!type || type.trim().length < 1) throw new Error('Type er påkrævet.')
    if (!department_id) throw new Error('Department er påkrævet.')

    return {
        name: name.trim(),
        type: type.trim(),
        department_id,
    }
}

export const validateUpdateCategory = (body: unknown) => {
    const { name, type } = body as {
        name?: string
        type?: string
    }

    if (!name || name.trim().length < 2) throw new Error('Navn skal være mindst 2 tegn.')
    if (!type || !['income', 'expense', 'tax', 'depreciation'].includes(type.trim())) {
        throw new Error('Type skal være income, expense, tax eller depreciation.')
    }

    return {
        name: name.trim(),
        type: type.trim(),
    }
}
