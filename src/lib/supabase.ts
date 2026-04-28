import { createClient } from '@supabase/supabase-js'
import { PostgrestClient } from '@supabase/postgrest-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('SUPABASE_URL og SUPABASE_SERVICE_ROLE_KEY skal være sat i miljøvariablerne.')
}

export const SUPABASE_URL = supabaseUrl
export const SUPABASE_SERVICE_ROLE_KEY = supabaseServiceRoleKey

// Used ONLY for auth.getUser() validation — never for DB queries.
export const supabaseAuthClient = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
})

// Raw PostgREST client: always uses the service-role key directly in headers.
// Not connected to the supabase-js auth system, so user JWTs processed by
// requireAuth/requireActiveProfile can never contaminate its credentials.
export const db = new PostgrestClient(`${supabaseUrl}/rest/v1`, {
    headers: {
        apikey: supabaseServiceRoleKey,
        Authorization: `Bearer ${supabaseServiceRoleKey}`,
    },
})

// Keep supabaseAdmin for auth.admin calls only (e.g. getUserById).
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
    db: { schema: 'public' },
})