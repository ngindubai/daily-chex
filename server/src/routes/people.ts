import { Router } from 'express'
import bcrypt from 'bcrypt'
import { db } from '../db/index.js'
import { people } from '../db/schema/index.js'
import { eq } from 'drizzle-orm'

const SALT_ROUNDS = 10
export const peopleRouter = Router()

// List people (filter by companyId, teamId)
peopleRouter.get('/', async (req, res) => {
  try {
    const companyId = req.query.companyId as string
    const teamId = req.query.teamId as string

    let rows
    if (teamId) {
      rows = await db.select().from(people).where(eq(people.teamId, teamId))
    } else if (companyId) {
      rows = await db.select().from(people).where(eq(people.companyId, companyId))
    } else {
      return res.status(400).json({ error: 'companyId or teamId query param required' })
    }
    res.json(rows.map(({ pin, passwordHash, ...safe }) => safe))
  } catch (err) {
    console.error('Error listing people:', err)
    res.status(500).json({ error: 'Failed to list people' })
  }
})

// Get single person
peopleRouter.get('/:id', async (req, res) => {
  try {
    const [row] = await db.select().from(people).where(eq(people.id, req.params.id))
    if (!row) return res.status(404).json({ error: 'Person not found' })
    const { pin, passwordHash, ...safe } = row
    res.json(safe)
  } catch (err) {
    console.error('Error getting person:', err)
    res.status(500).json({ error: 'Failed to get person' })
  }
})

// Create person
peopleRouter.post('/', async (req, res) => {
  try {
    const { companyId, teamId, firstName, lastName, phone, email, role, licenceNo, pin, password } = req.body
    if (!companyId || !firstName || !lastName) {
      return res.status(400).json({ error: 'companyId, firstName, and lastName are required' })
    }

    const hashedPin = pin ? await bcrypt.hash(pin, SALT_ROUNDS) : undefined
    const passwordHash = password ? await bcrypt.hash(password, SALT_ROUNDS) : undefined

    const [row] = await db
      .insert(people)
      .values({ companyId, teamId, firstName, lastName, phone, email, role, licenceNo, pin: hashedPin, passwordHash })
      .returning()
    // Strip sensitive fields from response
    const { pin: _pin, passwordHash: _ph, ...safe } = row
    res.status(201).json(safe)
  } catch (err) {
    console.error('Error creating person:', err)
    res.status(500).json({ error: 'Failed to create person' })
  }
})

// Update person
peopleRouter.patch('/:id', async (req, res) => {
  try {
    const { teamId, firstName, lastName, phone, email, role, licenceNo, status } = req.body
    const [row] = await db
      .update(people)
      .set({ teamId, firstName, lastName, phone, email, role, licenceNo, status, updatedAt: new Date() })
      .where(eq(people.id, req.params.id))
      .returning()
    if (!row) return res.status(404).json({ error: 'Person not found' })
    res.json(row)
  } catch (err) {
    console.error('Error updating person:', err)
    res.status(500).json({ error: 'Failed to update person' })
  }
})
