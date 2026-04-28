import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from '../lib/supabase'
import { SupportedKpiKey } from '../types'

// All operations use direct REST calls with the service-role key in the headers.
// This guarantees the correct credentials are used regardless of any auth-state
// that supabase-js may have set internally after processing user JWTs.
const serviceHeaders = {
    'Content-Type': 'application/json',
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
}

const base = `${SUPABASE_URL}/rest/v1/user_kpi_favorites`

export const getKpiFavorites = async (userId: string, organisationId: string): Promise<SupportedKpiKey[]> => {
    const url = `${base}?select=kpi_key&user_id=eq.${userId}&organisation_id=eq.${organisationId}&order=sort_order.asc,created_at.asc`
    const res = await fetch(url, { headers: serviceHeaders })
    if (!res.ok) {
        const body = await res.text()
        console.error('Hent fejl:', body)
        throw new Error('Kunne ikke hente KPI-favoritter.')
    }
    const rows: { kpi_key: string }[] = await res.json()
    return rows.map((r) => r.kpi_key as SupportedKpiKey)
}

export const replaceKpiFavorites = async (
    userId: string,
    organisationId: string,
    favorites: SupportedKpiKey[],
): Promise<SupportedKpiKey[]> => {
    const deleteRes = await fetch(
        `${base}?user_id=eq.${userId}&organisation_id=eq.${organisationId}`,
        { method: 'DELETE', headers: serviceHeaders },
    )
    if (!deleteRes.ok) {
        const body = await deleteRes.text()
        console.error('Slet fejl:', body)
        throw new Error('Kunne ikke opdatere KPI-favoritter.')
    }

    if (favorites.length > 0) {
        const rows = favorites.map((key, index) => ({
            user_id: userId,
            organisation_id: organisationId,
            kpi_key: key,
            sort_order: index,
        }))
        const insertRes = await fetch(base, {
            method: 'POST',
            headers: { ...serviceHeaders, Prefer: 'return=minimal' },
            body: JSON.stringify(rows),
        })
        if (!insertRes.ok) {
            const body = await insertRes.text()
            console.error('Indsæt fejl:', body)
            throw new Error('Kunne ikke gemme KPI-favoritter.')
        }
    }

    return getKpiFavorites(userId, organisationId)
}
