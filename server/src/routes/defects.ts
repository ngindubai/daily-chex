import { Router } from 'express'
import { db } from '../db/index.js'
import { defects } from '../db/schema/index.js'
import { eq, desc } from 'drizzle-orm'

export const defectsRouter = Router()

// List defects (filter by companyId, assetId)
defectsRouter.get('/', async (req, res) => {
  try {
    const companyId = req.query.companyId as string
    const assetId = req.query.assetId as string

    if (assetId) {
      const rows = await db.select().from(defects).where(eq(defects.assetId, assetId)).orderBy(desc(defects.createdAt))
      return res.json(rows)
    }
    if (companyId) {
      const rows = await db.select().from(defects).where(eq(defects.companyId, companyId)).orderBy(desc(defects.createdAt))
      return res.json(rows)
    }
    return res.status(400).json({ error: 'companyId or assetId query param required' })
  } catch (err) {
    console.error('Error listing defects:', err)
    res.status(500).json({ error: 'Failed to list defects' })
  }
})

// Get single defect
defectsRouter.get('/:id', async (req, res) => {
  try {
    const [row] = await db.select().from(defects).where(eq(defects.id, req.params.id))
    if (!row) return res.status(404).json({ error: 'Defect not found' })
    res.json(row)
  } catch (err) {
    console.error('Error getting defect:', err)
    res.status(500).json({ error: 'Failed to get defect' })
  }
})

// Create defect
defectsRouter.post('/', async (req, res) => {
  try {
    const { companyId, checkId, assetId, reportedBy, description, severity } = req.body
    if (!companyId || !assetId || !reportedBy || !description) {
      return res.status(400).json({ error: 'companyId, assetId, reportedBy, and description are required' })
    }

    const [row] = await db
      .insert(defects)
      .values({ companyId, checkId, assetId, reportedBy, description, severity })
      .returning()
    res.status(201).json(row)
  } catch (err) {
    console.error('Error creating defect:', err)
    res.status(500).json({ error: 'Failed to create defect' })
  }
})

// Update defect (status transition, resolve)
defectsRouter.patch('/:id', async (req, res) => {
  try {
    const { status, actionTaken, resolvedBy, severity } = req.body
    const updates: Record<string, unknown> = { updatedAt: new Date() }

    if (status) updates.status = status
    if (actionTaken) updates.actionTaken = actionTaken
    if (severity) updates.severity = severity
    if (resolvedBy) updates.resolvedBy = resolvedBy
    if (status === 'resolved' || status === 'accepted') {
      updates.resolvedAt = new Date()
      if (resolvedBy) updates.resolvedBy = resolvedBy
    }

    const [row] = await db
      .update(defects)
      .set(updates)
      .where(eq(defects.id, req.params.id))
      .returning()
    if (!row) return res.status(404).json({ error: 'Defect not found' })
    res.json(row)
  } catch (err) {
    console.error('Error updating defect:', err)
    res.status(500).json({ error: 'Failed to update defect' })
  }
})
