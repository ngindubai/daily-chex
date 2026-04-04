import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production'
const OPERATOR_EXPIRY = '30d'
const DASHBOARD_EXPIRY = '24h'

export interface JwtPayload {
  sub: string        // person.id
  companyId: string
  role: string       // operator | supervisor | manager | admin
  teamId?: string
  siteId?: string
}

export function signToken(payload: JwtPayload, isDashboard: boolean): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: isDashboard ? DASHBOARD_EXPIRY : OPERATOR_EXPIRY,
  })
}

export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, JWT_SECRET) as JwtPayload
}
