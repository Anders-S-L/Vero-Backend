export const validateCreateDepartment = (body: unknown) => {
    const { name } = body as { name?: string }
    if (!name || name.trim().length < 2) throw new Error('Navn skal være mindst 2 tegn.')
    return { name: name.trim() }
}