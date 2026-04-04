import { Router } from 'express'
import bcrypt from 'bcrypt'
import { db } from '../db/index.js'
import { people } from '../db/schema/index.js'
import { teams } from '../db/schema/index.js'
import { eq, and } from 'drizzle-orm'
import { signToken } from '../auth/jwt.js'
import { requireAuth } from '../auth/middleware.js'

export const authRouter = Router()

const SALT_ROUNDS = 10

/**
 * POST /api/auth/pin
 * Body: { companyId, pin }
 * Operator login — 4-digit PIN scoped to company.
 */
authRouter.post('/pin', async (req, res) => {
  try {
    const { companyId, pin } = req.body
    if (!companyId || !pin) {
      return res.status(400).json({ error: 'companyId and pin are required' })
    }

    // Get all active people in this company who have a PIN set
    const candidates = await db
      .select()
      .from(people)
      .where(and(eq(people.companyId, companyId), eq(people.status, 'active')))

    // Find the person whose hashed PIN matches
    let matched = null
    for (const person of candidates) {
      if (!person.pin) continue
      const isMatch = await bcrypt.compare(pin, person.pin)
      if (isMatch) {
        matched = person
        break
      }
    }

    if (!matched) {
      return res.status(401).json({ error: 'Invalid PIN' })
    }

    // Get team → site mapping
    let siteId: string | undefined
    if (matched.teamId) {
      const [team] = await db.select().from(teams).where(eq(teams.id, matched.teamId))
      if (team) siteId = team.siteId
    }

    const token = signToken(
      {
        sub: matched.id,
        companyId: matched.companyId,
        role: matched.role,
        teamId: matched.teamId ?? undefined,
        siteId,
      },
      false, // operator = long-lived token
    )

    res.json({
      token,
      user: {
        id: matched.id,
        firstName: matched.firstName,
        lastName: matched.lastName,
        role: matched.role,
        companyId: matched.companyId,
        teamId: matched.teamId,
        siteId,
      },
    })
  } catch (err) {
    console.error('PIN login error:', err)
    res.status(500).json({ error: 'Login failed' })
  }
})

/**
 * POST /api/auth/login
 * Body: { email, password }
 * Manager/admin login via email + password.
 */
authRouter.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' })
    }

    const [person] = await db
      .select()
      .from(people)
      .where(and(eq(people.email, email), eq(people.status, 'active')))

    if (!person || !person.passwordHash) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    const isMatch = await bcrypt.compare(password, person.passwordHash)
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    // Get team → site mapping
    let siteId: string | undefined
    if (person.teamId) {
      const [team] = await db.select().from(teams).where(eq(teams.id, person.teamId))
      if (team) siteId = team.siteId
    }

    const token = signToken(
      {
        sub: person.id,
        companyId: person.companyId,
        role: person.role,
        teamId: person.teamId ?? undefined,
        siteId,
      },
      true, // dashboard = 24h token
    )

    res.json({
      token,
      user: {
        id: person.id,
        firstName: person.firstName,
        lastName: person.lastName,
        role: person.role,
        companyId: person.companyId,
        teamId: person.teamId,
        siteId,
        email: person.email,
      },
    })
  } catch (err) {
    console.error('Email login error:', err)
    res.status(500).json({ error: 'Login failed' })
  }
})

/**
 * GET /api/auth/me
 * Returns current user info from JWT.
 */
authRouter.get('/me', requireAuth, async (req, res) => {
  try {
    const [person] = await db
      .select()
      .from(people)
      .where(eq(people.id, req.auth!.sub))

    if (!person) {
      return res.status(404).json({ error: 'User not found' })
    }

    let siteId: string | undefined
    if (person.teamId) {
      const [team] = await db.select().from(teams).where(eq(teams.id, person.teamId))
      if (team) siteId = team.siteId
    }

    res.json({
      id: person.id,
      firstName: person.firstName,
      lastName: person.lastName,
      role: person.role,
      companyId: person.companyId,
      teamId: person.teamId,
      siteId,
      email: person.email,
      phone: person.phone,
    })
  } catch (err) {
    console.error('Error getting user:', err)
    res.status(500).json({ error: 'Failed to get user' })
  }
})
