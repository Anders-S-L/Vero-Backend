import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('SUPABASE_URL og SUPABASE_SERVICE_ROLE_KEY skal være sat i miljøvariablerne.')
}

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
    db: {
        schema: 'public',
    }
})

export const createSupabaseAuthClient = () => createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
    db: {
        schema: 'public',
    },
})
