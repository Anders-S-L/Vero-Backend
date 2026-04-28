import { db } from '../lib/supabase'
import { KPI_DEFINITIONS } from './kpi.service'
import { OrganisationKpi, SupportedKpiKey } from '../types'
// håndtere hvilke kpiér en virksomhed har valgt at følge
export const listAvailableKpis = () => {
    return Object.entries(KPI_DEFINITIONS).map(([key, definition]) => ({
        key: key as SupportedKpiKey,
        name: definition.name,
        unit: definition.unit,
    }))
}

export const getTrackedKpis = async (organisationId: string): Promise<OrganisationKpi[]> => {
    const { data, error } = await db
        .from('organisation_kpis')
        .select('id, organisations_id, key, name, is_active, created_at, updated_at')
        .eq('organisations_id', organisationId)
        .eq('is_active', true)
        .order('created_at', { ascending: true })

    if (error) throw new Error('Kunne ikke hente valgte KPIer.')
    return (data ?? []) as OrganisationKpi[]
}

export const replaceTrackedKpis = async (organisationId: string, keys: SupportedKpiKey[]): Promise<OrganisationKpi[]> => {
    const uniqueKeys = [...new Set(keys)]
    const timestamp = new Date().toISOString()

    if (uniqueKeys.length > 0) {
        const rows = uniqueKeys.map((key) => ({
            organisations_id: organisationId,
            key,
            name: KPI_DEFINITIONS[key].name,
            is_active: true,
            updated_at: timestamp,
        }))

        const { error } = await db
            .from('organisation_kpis')
            .upsert(rows, { onConflict: 'organisations_id,key' })

        if (error) throw new Error('Kunne ikke gemme valgte KPIer.')
    }

    const { data: existingRows, error: existingError } = await db
        .from('organisation_kpis')
        .select('key')
        .eq('organisations_id', organisationId)

    if (existingError) throw new Error('Kunne ikke opdatere valgte KPIer.')

    const inactiveKeys = (existingRows ?? [])
        .map((row) => row.key as SupportedKpiKey)
        .filter((key) => !uniqueKeys.includes(key))

    if (inactiveKeys.length > 0) {
        const { error } = await db
            .from('organisation_kpis')
            .update({ is_active: false, updated_at: timestamp })
            .eq('organisations_id', organisationId)
            .in('key', inactiveKeys)

        if (error) throw new Error('Kunne ikke deaktivere fravalgte KPIer.')
    }

    return getTrackedKpis(organisationId)
}
