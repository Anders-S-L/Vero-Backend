export const validateCreateTransaction = (body: unknown) => {
    const { amount, date, category_id, description, repeat_monthly, repeat_until } = body as {
        amount?: number
        date?: string
        category_id?: string
        description?: string
        repeat_monthly?: boolean
        repeat_until?: string
    }
    if (!amount || isNaN(amount)) throw new Error('Beløb er påkrævet.')
    if (!date) throw new Error('Dato er påkrævet.')
    if (!category_id) throw new Error('Kategori er påkrævet.')
    if (!description || description.trim().length < 2) throw new Error('Beskrivelse er påkrævet.')
    if (repeat_monthly && !repeat_until) throw new Error('repeat_until er påkrævet når repeat_monthly er true.')
    if (repeat_until) {
        const repeatUntilDate = new Date(repeat_until)
        const transactionDate = new Date(date)
        if (isNaN(repeatUntilDate.getTime())) throw new Error('repeat_until skal være en gyldig dato.')
        if (repeatUntilDate < transactionDate) throw new Error('repeat_until skal være samme dag eller efter dato.')
    }

    return {
        amount,
        date,
        category_id,
        description: description || null,
        repeat_monthly: Boolean(repeat_monthly),
        repeat_until: repeat_until || null,
    }
}