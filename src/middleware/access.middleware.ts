import { NextFunction, Request, Response } from 'express'
import { db, supabaseAuthClient } from '../lib/supabase'

type UserRole = 'admin' | 'manager' | 'employee'

const normalizeRole = (role: unknown): UserRole | null => {
    const normalized = typeof role === 'string' ? role.toLowerCase().trim() : ''
    return ['admin', 'manager', 'employee'].includes(normalized) ? normalized as UserRole : null
}

declare global {
    namespace Express {
        interface Request {
            user?: { id: string; email?: string }
            userProfile?: {
                id: string
                organisations_id: string
                role: UserRole
                is_active: boolean
            }
        }
    }
}

const loadActiveProfile = async (userId: string) => {
    const { data: profile, error } = await db
        .from('profiles')
        .select('id, organisations_id, role, is_active')
        .eq('id', userId)
        .single()

    const role = normalizeRole(profile?.role)

    if (error || !profile || !profile.is_active || !role) {
        return null
    }

    return { ...profile, role } as Express.Request['userProfile']
}

export const requireAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const token = req.headers.authorization?.replace('Bearer ', '').trim()

    if (!token) {
        res.status(401).json({ success: false, error: 'Manglende token.' })
        return
    }

    const { data, error } = await supabaseAuthClient.auth.getUser(token)

    if (error || !data.user) {
        res.status(401).json({ success: false, error: 'Ugyldig eller udløbet token.' })
        return
    }

    req.user = { id: data.user.id, email: data.user.email }
    next()
}

export const requireActiveProfile = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const profile = await loadActiveProfile(req.user!.id)

    if (!profile) {
        res.status(403).json({ success: false, error: 'Adgang nægtet.' })
        return
    }

    req.userProfile = profile
    next()
}

export const requireAdmin = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const profile = await loadActiveProfile(req.user!.id)

    if (!profile || profile.role !== 'admin') {
        res.status(403).json({ success: false, error: 'Adgang nægtet.' })
        return
    }

    req.userProfile = profile
    next()
}

export const requireManager = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const profile = await loadActiveProfile(req.user!.id)

    if (!profile || !['admin', 'manager'].includes(profile.role)) {
        res.status(403).json({ success: false, error: 'Adgang nægtet.' })
        return
    }

    req.userProfile = profile
    next()
}
