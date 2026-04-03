import { Router } from 'express'
import { db } from '../db/index.js'
import { people } from '../db/schema/index.js'
import { eq } from 'drizzle-orm'

export const peopleRouter = Router()

// List people (filter by companyId, teamId)
peopleRouter.get('/', async (req, res) => {
  try {
    const companyId = req.query.companyId as string
    const teamId = req.query.teamId as string

    if (teamId) {
      const rows = await db.select().from(people).where(eq(people.teamId, teamId))
      return res.json(rows)
    }
    if (companyId) {
      const rows = await db.select().from(people).where(eq(people.companyId, companyId))
      return res.json(rows)
    }
    return res.status(400).json({ error: 'companyId or teamId query param required' })
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
    res.json(row)
  } catch (err) {
    console.error('Error getting person:', err)
    res.status(500).json({ error: 'Failed to get person' })
  }
})

// Create person
peopleRouter.post('/', async (req, res) => {
  try {
    const { companyId, teamId, firstName, lastName, phone, email, role, licenceNo, pin } = req.body
    if (!companyId || !firstName || !lastName) {
      return res.status(400).json({ error: 'companyId, firstName, and lastName are required' })
    }

    const [row] = await db
      .insert(people)
      .values({ companyId, teamId, firstName, lastName, phone, email, role, licenceNo, pin })
      .returning()
    res.status(201).json(row)
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
