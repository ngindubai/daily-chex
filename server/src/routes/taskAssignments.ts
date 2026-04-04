import { Router } from 'express'
import { db } from '../db/index.js'
import { taskAssignments } from '../db/schema/index.js'
import { eq, and, or, desc, count } from 'drizzle-orm'

export const taskAssignmentsRouter = Router()

// List task assignments (filter by companyId, assignedTo, assignedTeam, status)
taskAssignmentsRouter.get('/', async (req, res) => {
  try {
    const companyId = req.query.companyId as string
    const assignedTo = req.query.assignedTo as string
    const assignedTeam = req.query.assignedTeam as string
    const status = req.query.status as string

    if (!companyId) return res.status(400).json({ error: 'companyId query param required' })

    let query = db.select().from(taskAssignments).where(eq(taskAssignments.companyId, companyId)).$dynamic()

    if (assignedTo) {
      query = query.where(and(eq(taskAssignments.companyId, companyId), eq(taskAssignments.assignedTo, assignedTo)))
    }
    if (assignedTeam) {
      query = query.where(and(eq(taskAssignments.companyId, companyId), eq(taskAssignments.assignedTeam, assignedTeam)))
    }

    const rows = await query.orderBy(desc(taskAssignments.createdAt))

    // Filter by status in JS since dynamic chaining is tricky
    const filtered = status ? rows.filter((r) => r.status === status) : rows
    res.json(filtered)
  } catch (err) {
    console.error('Error listing task assignments:', err)
    res.status(500).json({ error: 'Failed to list task assignments' })
  }
})

// Get single task assignment
taskAssignmentsRouter.get('/:id', async (req, res) => {
  try {
    const [row] = await db.select().from(taskAssignments).where(eq(taskAssignments.id, req.params.id))
    if (!row) return res.status(404).json({ error: 'Task assignment not found' })
    res.json(row)
  } catch (err) {
    console.error('Error getting task assignment:', err)
    res.status(500).json({ error: 'Failed to get task assignment' })
  }
})

// Create task assignment (manager creates a check task for an operative)
taskAssignmentsRouter.post('/', async (req, res) => {
  try {
    const { companyId, assetId, checkTemplateId, assignedTo, assignedTeam, siteId, createdBy, priority, dueDate, notes } = req.body
    if (!companyId || !assetId || !checkTemplateId || !createdBy) {
      return res.status(400).json({ error: 'companyId, assetId, checkTemplateId, and createdBy are required' })
    }
    if (!assignedTo && !assignedTeam) {
      return res.status(400).json({ error: 'Either assignedTo (person) or assignedTeam is required' })
    }

    const [row] = await db
      .insert(taskAssignments)
      .values({ companyId, assetId, checkTemplateId, assignedTo, assignedTeam, siteId, createdBy, priority, dueDate, notes })
      .returning()
    res.status(201).json(row)
  } catch (err) {
    console.error('Error creating task assignment:', err)
    res.status(500).json({ error: 'Failed to create task assignment' })
  }
})

// Update task assignment (status transition, mark completed)
taskAssignmentsRouter.patch('/:id', async (req, res) => {
  try {
    const { status, completedCheckId, notes } = req.body
    const updates: Record<string, unknown> = { updatedAt: new Date() }

    if (status) updates.status = status
    if (notes !== undefined) updates.notes = notes
    if (completedCheckId) updates.completedCheckId = completedCheckId
    if (status === 'completed') updates.completedAt = new Date()

    const [row] = await db
      .update(taskAssignments)
      .set(updates)
      .where(eq(taskAssignments.id, req.params.id))
      .returning()
    if (!row) return res.status(404).json({ error: 'Task assignment not found' })
    res.json(row)
  } catch (err) {
    console.error('Error updating task assignment:', err)
    res.status(500).json({ error: 'Failed to update task assignment' })
  }
})

// Get pending task count for a person (for dashboard badge)
taskAssignmentsRouter.get('/count/pending', async (req, res) => {
  try {
    const assignedTo = req.query.assignedTo as string
    const companyId = req.query.companyId as string
    if (!companyId) return res.status(400).json({ error: 'companyId required' })

    let rows
    if (assignedTo) {
      rows = await db.select({ count: count() }).from(taskAssignments)
        .where(and(eq(taskAssignments.companyId, companyId), eq(taskAssignments.assignedTo, assignedTo), eq(taskAssignments.status, 'pending')))
    } else {
      rows = await db.select({ count: count() }).from(taskAssignments)
        .where(and(eq(taskAssignments.companyId, companyId), eq(taskAssignments.status, 'pending')))
    }
    res.json({ count: rows[0]?.count ?? 0 })
  } catch (err) {
    console.error('Error counting tasks:', err)
    res.status(500).json({ error: 'Failed to count tasks' })
  }
})
