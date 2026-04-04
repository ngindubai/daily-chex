import { Router } from 'express'
import { db } from '../db/index.js'
import { checks, checkItems, defects, assets, checkTemplateItems } from '../db/schema/index.js'
import { eq, desc, and } from 'drizzle-orm'

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

// Complete check — also auto-creates defects from failed items
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

    // Auto-create defects from failed items
    if (overallResult === 'fail') {
      try {
        const failedItems = await db
          .select()
          .from(checkItems)
          .where(and(eq(checkItems.checkId, req.params.id), eq(checkItems.result, 'fail')))

        // Look up template item labels for descriptions
        const templateItemIds = failedItems.map((i) => i.templateItemId)
        const tplItems = templateItemIds.length
          ? await db.select().from(checkTemplateItems).where(
              // manual IN via or
              eq(checkTemplateItems.id, templateItemIds[0]),
            ).then(async (first) => {
              if (templateItemIds.length <= 1) return first
              const rest = await Promise.all(
                templateItemIds.slice(1).map((tid) =>
                  db.select().from(checkTemplateItems).where(eq(checkTemplateItems.id, tid)).then((r) => r[0]),
                ),
              )
              return [...first, ...rest.filter(Boolean)]
            })
          : []
        const labelMap = new Map(tplItems.map((t) => [t.id, t.label]))

        let hasCritical = false
        for (const item of failedItems) {
          const label = labelMap.get(item.templateItemId) || 'Check item failed'
          const description = item.notes
            ? `${label}: ${item.notes}`
            : label

          // Determine severity based on section/label keywords
          let severity: 'low' | 'medium' | 'high' | 'critical' = 'medium'
          const lower = label.toLowerCase()
          if (lower.includes('brake') || lower.includes('steering') || lower.includes('fire')) {
            severity = 'critical'
            hasCritical = true
          } else if (lower.includes('tyre') || lower.includes('light') || lower.includes('exhaust')) {
            severity = 'high'
          }

          await db.insert(defects).values({
            companyId: row.companyId,
            checkId: row.id,
            assetId: row.assetId,
            reportedBy: row.personId,
            description,
            severity,
          })
        }

        // Critical defect auto-flags asset as defective
        if (hasCritical) {
          await db
            .update(assets)
            .set({ status: 'defective', updatedAt: new Date() })
            .where(eq(assets.id, row.assetId))
        }
      } catch (defectErr) {
        console.error('Error auto-creating defects:', defectErr)
        // Don't fail the check completion if defect creation fails
      }
    }

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
