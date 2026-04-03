import { Router } from 'express'
import { db } from '../db/index.js'
import { sites } from '../db/schema/index.js'
import { eq, and } from 'drizzle-orm'

export const sitesRouter = Router()

// List sites for a company
sitesRouter.get('/', async (req, res) => {
  try {
    const companyId = req.query.companyId as string
    if (!companyId) return res.status(400).json({ error: 'companyId query param required' })

    const rows = await db.select().from(sites).where(eq(sites.companyId, companyId))
    res.json(rows)
  } catch (err) {
    console.error('Error listing sites:', err)
    res.status(500).json({ error: 'Failed to list sites' })
  }
})

// Get single site
sitesRouter.get('/:id', async (req, res) => {
  try {
    const [row] = await db.select().from(sites).where(eq(sites.id, req.params.id))
    if (!row) return res.status(404).json({ error: 'Site not found' })
    res.json(row)
  } catch (err) {
    console.error('Error getting site:', err)
    res.status(500).json({ error: 'Failed to get site' })
  }
})

// Create site
sitesRouter.post('/', async (req, res) => {
  try {
    const { companyId, name, address, postcode, lat, lng } = req.body
    if (!companyId || !name) return res.status(400).json({ error: 'companyId and name are required' })

    const [row] = await db.insert(sites).values({ companyId, name, address, postcode, lat, lng }).returning()
    res.status(201).json(row)
  } catch (err) {
    console.error('Error creating site:', err)
    res.status(500).json({ error: 'Failed to create site' })
  }
})

// Update site
sitesRouter.patch('/:id', async (req, res) => {
  try {
    const { name, address, postcode, lat, lng, status } = req.body
    const [row] = await db
      .update(sites)
      .set({ name, address, postcode, lat, lng, status, updatedAt: new Date() })
      .where(eq(sites.id, req.params.id))
      .returning()
    if (!row) return res.status(404).json({ error: 'Site not found' })
    res.json(row)
  } catch (err) {
    console.error('Error updating site:', err)
    res.status(500).json({ error: 'Failed to update site' })
  }
})
