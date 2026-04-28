import { NextFunction, Request, Response } from 'express'
import { db, supabaseAuthClient } from '../lib/supabase'

declare global {
    namespace Express {
        interface Request {
            user?: { id: string; email?: string }
            userProfile?: {
                id: string
                organisations_id: string
                role: 'admin' | 'manager' | 'employee' | 'auditor'
                is_active: boolean
            }
        }
    }
}

export const requireAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const token = req.headers.authorization?.replace('Bearer ', '').trim()
    console.log('token modtaget:', token?.substring(0, 20))

    if (!token) {
        res.status(401).json({ success: false, error: 'Manglende token.' })
        return
    }

    const { data, error } = await supabaseAuthClient.auth.getUser(token)
    console.log('auth user:', data?.user?.id)
    console.log('auth error:', error)

    if (error || !data.user) {
        res.status(401).json({ success: false, error: 'Ugyldig eller udløbet token.' })
        return
    }

    req.user = { id: data.user.id, email: data.user.email }
    next()
}

export const requireActiveProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const { data: profile, error } = await db
        .from('profiles')
        .select('id, organisations_id, role, is_active')
        .eq('id', req.user!.id)
        .single()

    console.log('profile:', profile)
    console.log('error:', error)

    if (error || !profile || !profile.is_active) {
        res.status(403).json({ success: false, error: 'Adgang nægtet.' })
        return
    }

    req.userProfile = profile
    next()
}

export const requireAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {

    const { data: profile, error } = await db
        .from('profiles')
        .select('id, organisations_id, role, is_active')
        .eq('id', req.user!.id)
        .single()

    console.log('profile:', profile)
    console.log('error:', error)

    if (error || !profile || !profile.is_active || profile.role !== 'admin') {
        res.status(403).json({ success: false, error: 'Adgang nægtet.' })
        return
    }

    req.userProfile = profile
    next()
}