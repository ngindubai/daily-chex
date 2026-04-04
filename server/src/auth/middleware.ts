import { Request, Response, NextFunction } from 'express'
import { verifyToken, JwtPayload } from './jwt.js'

// Extend Express Request with auth info
declare global {
  namespace Express {
    interface Request {
      auth?: JwtPayload
    }
  }
}

/**
 * Require a valid JWT. Extracts Bearer token from Authorization header.
 */
export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required' })
    return
  }

  try {
    const token = header.slice(7)
    req.auth = verifyToken(token)
    next()
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' })
  }
}

/**
 * Require specific role(s). Must be used after requireAuth.
 */
export function requireRole(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.auth) {
      res.status(401).json({ error: 'Authentication required' })
      return
    }
    if (!roles.includes(req.auth.role)) {
      res.status(403).json({ error: 'Insufficient permissions' })
      return
    }
    next()
  }
}

/**
 * Require company scope — ensures the authenticated user belongs to the requested company.
 */
export function requireCompany(req: Request, res: Response, next: NextFunction): void {
  if (!req.auth) {
    res.status(401).json({ error: 'Authentication required' })
    return
  }
  // Check companyId in query, params, or body
  const companyId = req.params.companyId || req.query.companyId || (req.body && req.body.companyId)
  if (companyId && companyId !== req.auth.companyId) {
    res.status(403).json({ error: 'Access denied to this company' })
    return
  }
  next()
}
