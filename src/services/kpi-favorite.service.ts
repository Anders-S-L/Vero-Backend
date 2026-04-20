import { supabaseAdmin } from '../lib/supabase'
import { FavoriteKpiKey } from '../validators/kpi-favorite.validator'

type UserKpiFavoriteRow = {
    kpi_key: FavoriteKpiKey
}

export const getKpiFavorites = async (userId: string, organisationId: string): Promise<FavoriteKpiKey[]> => {
    const { data, error } = await supabaseAdmin
        .from('user_kpi_favorites')
        .select('kpi_key')
        .eq('user_id', userId)
        .eq('organisation_id', organisationId)
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: true })

    if (error) throw new Error('Kunne ikke hente KPI-favoritter.')

    return ((data ?? []) as UserKpiFavoriteRow[]).map((row) => row.kpi_key)
}

export const replaceKpiFavorites = async (
    userId: string,
    organisationId: string,
    favorites: FavoriteKpiKey[],
): Promise<FavoriteKpiKey[]> => {
    const { error: deleteError } = await supabaseAdmin
        .from('user_kpi_favorites')
        .delete()
        .eq('user_id', userId)
        .eq('organisation_id', organisationId)

    if (deleteError) {
        console.error('Kunne ikke slette eksisterende KPI-favoritter:', deleteError)
        throw new Error('Kunne ikke opdatere KPI-favoritter.')
    }

    if (favorites.length > 0) {
        const rows = favorites.map((key, index) => ({
            user_id: userId,
            organisation_id: organisationId,
            kpi_key: key,
            sort_order: index,
        }))

        const { error: insertError } = await supabaseAdmin
            .from('user_kpi_favorites')
            .insert(rows)

        if (insertError) {
            console.error('Kunne ikke indsætte KPI-favoritter:', insertError)
            throw new Error('Kunne ikke gemme KPI-favoritter.')
        }
    }

    return getKpiFavorites(userId, organisationId)
}
