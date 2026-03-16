export const validateCreateTransaction = (body: unknown) => {
    const { amount, date, category_id, description } = body as {
        amount?: number
        date?: string
        category_id?: string
        description?: string
    }
    if (!amount || isNaN(amount)) throw new Error('Beløb er påkrævet.')
    if (!date) throw new Error('Dato er påkrævet.')
    if (!category_id) throw new Error('Kategori er påkrævet.')
    if (!description || description.trim().length < 2) throw new Error('Beskrivelse er påkrævet.')
    return { amount, date, category_id, description: description || null }
}