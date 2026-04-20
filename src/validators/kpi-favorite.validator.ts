import { SupportedKpiKey } from '../types'

export const FAVORITE_KPI_KEYS = [
    'revenue',
    'ebitda',
    'netResult',
    'cashFlow',
    'burnRate',
    'monthlyGrowthRate',
    'grossProfit',
    'grossMargin',
    'variableCosts',
    'contributionMargin',
    'liquidityRatio',
    'debtorDays',
] as const satisfies readonly SupportedKpiKey[]

export type FavoriteKpiKey = (typeof FAVORITE_KPI_KEYS)[number]

const allowedFavoriteKpis = new Set<string>(FAVORITE_KPI_KEYS)

export const validateKpiFavoritesBody = (body: unknown) => {
    const { favorites } = body as {
        favorites?: string[]
    }

    if (!Array.isArray(favorites)) throw new Error('favorites skal være en liste.')

    const uniqueFavorites = [...new Set(favorites)]

    if (uniqueFavorites.some((key) => !allowedFavoriteKpis.has(key))) {
        throw new Error('Ukendt KPI-key.')
    }

    return { favorites: uniqueFavorites as FavoriteKpiKey[] }
}
