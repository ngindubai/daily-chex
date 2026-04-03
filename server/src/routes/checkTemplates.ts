import { Router } from 'express'
import { db } from '../db/index.js'
import { checkTemplates, checkTemplateItems } from '../db/schema/index.js'
import { eq } from 'drizzle-orm'

export const checkTemplatesRouter = Router()

// List templates (optionally filter by companyId)
checkTemplatesRouter.get('/', async (req, res) => {
  try {
    const companyId = req.query.companyId as string
    if (companyId) {
      const rows = await db.select().from(checkTemplates).where(eq(checkTemplates.companyId, companyId))
      return res.json(rows)
    }
    const rows = await db.select().from(checkTemplates)
    res.json(rows)
  } catch (err) {
    console.error('Error listing templates:', err)
    res.status(500).json({ error: 'Failed to list templates' })
  }
})

// Get template with items
checkTemplatesRouter.get('/:id', async (req, res) => {
  try {
    const [template] = await db.select().from(checkTemplates).where(eq(checkTemplates.id, req.params.id))
    if (!template) return res.status(404).json({ error: 'Template not found' })

    const items = await db
      .select()
      .from(checkTemplateItems)
      .where(eq(checkTemplateItems.templateId, req.params.id))
      .orderBy(checkTemplateItems.sortOrder)
    res.json({ ...template, items })
  } catch (err) {
    console.error('Error getting template:', err)
    res.status(500).json({ error: 'Failed to get template' })
  }
})
