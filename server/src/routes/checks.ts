import { Router } from 'express'
import { db } from '../db/index.js'
import { checks, checkItems } from '../db/schema/index.js'
import { eq, desc } from 'drizzle-orm'

export const checksRouter = Router()

// List checks (filter by companyId, assetId, personId)
checksRouter.get('/', async (req, res) => {
  try {
    const companyId = req.query.companyId as string
    const assetId = req.query.assetId as string
    const personId = req.query.personId as string

    let query = db.select().from(checks)

    if (assetId) {
      const rows = await db.select().from(checks).where(eq(checks.assetId, assetId)).orderBy(desc(checks.createdAt))
      return res.json(rows)
    }
    if (personId) {
      const rows = await db.select().from(checks).where(eq(checks.personId, personId)).orderBy(desc(checks.createdAt))
      return res.json(rows)
    }
    if (companyId) {
      const rows = await db.select().from(checks).where(eq(checks.companyId, companyId)).orderBy(desc(checks.createdAt))
      return res.json(rows)
    }
    return res.status(400).json({ error: 'companyId, assetId, or personId query param required' })
  } catch (err) {
    console.error('Error listing checks:', err)
    res.status(500).json({ error: 'Failed to list checks' })
  }
})

// Get single check with items
checksRouter.get('/:id', async (req, res) => {
  try {
    const [check] = await db.select().from(checks).where(eq(checks.id, req.params.id))
    if (!check) return res.status(404).json({ error: 'Check not found' })

    const items = await db.select().from(checkItems).where(eq(checkItems.checkId, req.params.id))
    res.json({ ...check, items })
  } catch (err) {
    console.error('Error getting check:', err)
    res.status(500).json({ error: 'Failed to get check' })
  }
})

// Create check (start a new check)
checksRouter.post('/', async (req, res) => {
  try {
    const {
      companyId, assetId, personId, siteId, teamId,
      checkTemplateId, mileageStart, placePurked, weekEnding,
      startLat, startLng, startAccuracy, notes,
    } = req.body
    if (!companyId || !assetId || !personId || !checkTemplateId) {
      return res.status(400).json({ error: 'companyId, assetId, personId, and checkTemplateId are required' })
    }

    const [row] = await db
      .insert(checks)
      .values({
        companyId, assetId, personId, siteId, teamId,
        checkTemplateId, mileageStart, placePurked, weekEnding,
        startLat, startLng, startAccuracy, notes,
      })
      .returning()
    res.status(201).json(row)
  } catch (err) {
    console.error('Error creating check:', err)
    res.status(500).json({ error: 'Failed to create check' })
  }
})

// Complete check
checksRouter.patch('/:id/complete', async (req, res) => {
  try {
    const {
      overallResult, mileageEnd, signatureUrl, agentSignature,
      businessMileageConfirmed, endLat, endLng, endAccuracy, notes,
    } = req.body
    const [row] = await db
      .update(checks)
      .set({
        status: 'completed',
        overallResult, mileageEnd, signatureUrl, agentSignature,
        businessMileageConfirmed, endLat, endLng, endAccuracy, notes,
        completedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(checks.id, req.params.id))
      .returning()
    if (!row) return res.status(404).json({ error: 'Check not found' })
    res.json(row)
  } catch (err) {
    console.error('Error completing check:', err)
    res.status(500).json({ error: 'Failed to complete check' })
  }
})

// Add check items (batch)
checksRouter.post('/:id/items', async (req, res) => {
  try {
    const checkId = req.params.id
    const { items } = req.body as { items: Array<{ templateItemId: string; dayOfWeek?: number; result: 'pass' | 'fail' | 'na'; notes?: string }> }
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ error: 'items array is required' })
    }

    const rows = await db
      .insert(checkItems)
      .values(items.map((item) => ({ ...item, checkId })))
      .returning()
    res.status(201).json(rows)
  } catch (err) {
    console.error('Error adding check items:', err)
    res.status(500).json({ error: 'Failed to add check items' })
  }
})
