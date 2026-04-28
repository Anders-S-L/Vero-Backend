import { SupportedKpiKey } from '../types'

export const FAVORITE_KPI_KEYS: SupportedKpiKey[] = [
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
]

const allowedFavoriteKpis = new Set<string>(FAVORITE_KPI_KEYS)

export const validateKpiFavoritesBody = (body: unknown): { favorites: SupportedKpiKey[] } => {
    const { favorites } = body as { favorites: unknown }
    if (!Array.isArray(favorites)) throw new Error('favorites skal være en liste.')

    const uniqueFavorites = [...new Set(favorites)] as SupportedKpiKey[]
    if (uniqueFavorites.some((key) => !allowedFavoriteKpis.has(key))) {
        throw new Error('Ukendt KPI-key.')
    }

    return { favorites: uniqueFavorites }
}
