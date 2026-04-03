import { Router } from 'express'
import { db } from '../db/index.js'
import { teams } from '../db/schema/index.js'
import { eq } from 'drizzle-orm'

export const teamsRouter = Router()

// List teams (filter by siteId or companyId)
teamsRouter.get('/', async (req, res) => {
  try {
    const siteId = req.query.siteId as string
    const companyId = req.query.companyId as string

    if (siteId) {
      const rows = await db.select().from(teams).where(eq(teams.siteId, siteId))
      return res.json(rows)
    }
    if (companyId) {
      const rows = await db.select().from(teams).where(eq(teams.companyId, companyId))
      return res.json(rows)
    }
    return res.status(400).json({ error: 'siteId or companyId query param required' })
  } catch (err) {
    console.error('Error listing teams:', err)
    res.status(500).json({ error: 'Failed to list teams' })
  }
})

// Get single team
teamsRouter.get('/:id', async (req, res) => {
  try {
    const [row] = await db.select().from(teams).where(eq(teams.id, req.params.id))
    if (!row) return res.status(404).json({ error: 'Team not found' })
    res.json(row)
  } catch (err) {
    console.error('Error getting team:', err)
    res.status(500).json({ error: 'Failed to get team' })
  }
})

// Create team
teamsRouter.post('/', async (req, res) => {
  try {
    const { companyId, siteId, name, leaderId } = req.body
    if (!companyId || !siteId || !name) {
      return res.status(400).json({ error: 'companyId, siteId, and name are required' })
    }

    const [row] = await db.insert(teams).values({ companyId, siteId, name, leaderId }).returning()
    res.status(201).json(row)
  } catch (err) {
    console.error('Error creating team:', err)
    res.status(500).json({ error: 'Failed to create team' })
  }
})

// Update team
teamsRouter.patch('/:id', async (req, res) => {
  try {
    const { name, siteId, leaderId, status } = req.body
    const [row] = await db
      .update(teams)
      .set({ name, siteId, leaderId, status, updatedAt: new Date() })
      .where(eq(teams.id, req.params.id))
      .returning()
    if (!row) return res.status(404).json({ error: 'Team not found' })
    res.json(row)
  } catch (err) {
    console.error('Error updating team:', err)
    res.status(500).json({ error: 'Failed to update team' })
  }
})
