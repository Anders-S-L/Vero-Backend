import { LoginRequest, RegisterOwnerRequest } from '../types'

const isValidEmail = (email: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export const validateRegisterOwnerInput = (payload: unknown): RegisterOwnerRequest => {
    if (!payload || typeof payload !== 'object') {
        throw new Error('Body skal være et JSON objekt.')
    }

    const {
        email,
        password,
        fullName,
        organisationName,
        cvr,
        currency,
        fiscalYearStart,
    } = payload as Partial<RegisterOwnerRequest>

    if (!email || !isValidEmail(email)) {
        throw new Error('Ugyldig email.')
    }

    if (!password || password.length < 8) {
        throw new Error('Password skal være mindst 8 tegn.')
    }

    if (!fullName || fullName.trim().length < 2) {
        throw new Error('fullName skal være mindst 2 tegn.')
    }

    if (!organisationName || organisationName.trim().length < 2) {
        throw new Error('organisationName skal være mindst 2 tegn.')
    }

    if (!currency || currency.trim().length !== 3) {
        throw new Error('currency skal være en 3-bogstavs kode, fx DKK.')
    }

    if (
        typeof fiscalYearStart !== 'number' ||
        !Number.isInteger(fiscalYearStart) ||
        fiscalYearStart < 1 ||
        fiscalYearStart > 12
    ) {
        throw new Error('fiscalYearStart skal være et heltal mellem 1 og 12.')
    }

    return {
        email: email.trim().toLowerCase(),
        password,
        fullName: fullName.trim(),
        organisationName: organisationName.trim(),
        cvr: cvr?.trim() || undefined,
        currency: currency.trim().toUpperCase(),
        fiscalYearStart,
    }
}

export const validateLoginInput = (payload: unknown): LoginRequest => {
    if (!payload || typeof payload !== 'object') {
        throw new Error('Body skal være et JSON objekt.')
    }

    const { email, password } = payload as Partial<LoginRequest>

    if (!email || !isValidEmail(email)) {
        throw new Error('Ugyldig email.')
    }

    if (!password || password.length < 8) {
        throw new Error('Password skal være mindst 8 tegn.')
    }

    return {
        email: email.trim().toLowerCase(),
        password,
    }
}