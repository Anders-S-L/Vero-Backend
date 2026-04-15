import { supabaseAdmin } from '../lib/supabase'

export const getProfilesService = async (requesterId: string) => {
    const { data: requesterProfile, error: requesterProfileError } = await supabaseAdmin
        .from('profiles')
        .select('organisations_id')
        .eq('id', requesterId)
        .single()

    if (requesterProfileError || !requesterProfile) {
        throw new Error('Kunne ikke finde brugerens organisation.')
    }

    const { data, error } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name, role, is_active, invited_by, created_at')
        .eq('organisations_id', requesterProfile.organisations_id)
        .order('created_at', { ascending: true })

    if (error) {
        throw new Error('Kunne ikke hente profiler.')
    }

    return data
}