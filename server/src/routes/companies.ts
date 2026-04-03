import { Router } from 'express'
import { db } from '../db/index.js'
import { companies } from '../db/schema/index.js'
import { eq } from 'drizzle-orm'

export const companiesRouter = Router()

// List all companies
companiesRouter.get('/', async (_req, res) => {
  try {
    const rows = await db.select().from(companies)
    res.json(rows)
  } catch (err) {
    console.error('Error listing companies:', err)
    res.status(500).json({ error: 'Failed to list companies' })
  }
})

// Get single company
companiesRouter.get('/:id', async (req, res) => {
  try {
    const [row] = await db.select().from(companies).where(eq(companies.id, req.params.id))
    if (!row) return res.status(404).json({ error: 'Company not found' })
    res.json(row)
  } catch (err) {
    console.error('Error getting company:', err)
    res.status(500).json({ error: 'Failed to get company' })
  }
})

// Create company
companiesRouter.post('/', async (req, res) => {
  try {
    const { name, slug } = req.body
    if (!name || !slug) return res.status(400).json({ error: 'name and slug are required' })

    const [row] = await db.insert(companies).values({ name, slug }).returning()
    res.status(201).json(row)
  } catch (err) {
    console.error('Error creating company:', err)
    res.status(500).json({ error: 'Failed to create company' })
  }
})
