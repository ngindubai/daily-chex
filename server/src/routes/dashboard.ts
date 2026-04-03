import { Router } from 'express'
import { db } from '../db/index.js'
import { checks, assets, defects, sites, people } from '../db/schema/index.js'
import { eq, and, sql, gte, count } from 'drizzle-orm'

export const dashboardRouter = Router()

// Dashboard overview stats for a company
dashboardRouter.get('/stats', async (req, res) => {
  try {
    const companyId = req.query.companyId as string
    if (!companyId) return res.status(400).json({ error: 'companyId query param required' })

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // Total active assets
    const [assetCount] = await db
      .select({ count: count() })
      .from(assets)
      .where(and(eq(assets.companyId, companyId), eq(assets.status, 'active')))

    // Checks today
    const [checksToday] = await db
      .select({ count: count() })
      .from(checks)
      .where(and(eq(checks.companyId, companyId), gte(checks.createdAt, today)))

    // Open defects
    const [openDefects] = await db
      .select({ count: count() })
      .from(defects)
      .where(and(eq(defects.companyId, companyId), eq(defects.status, 'open')))

    // Active sites
    const [siteCount] = await db
      .select({ count: count() })
      .from(sites)
      .where(and(eq(sites.companyId, companyId), eq(sites.status, 'active')))

    // Active people
    const [peopleCount] = await db
      .select({ count: count() })
      .from(people)
      .where(and(eq(people.companyId, companyId), eq(people.status, 'active')))

    res.json({
      totalAssets: assetCount?.count ?? 0,
      checksToday: checksToday?.count ?? 0,
      openDefects: openDefects?.count ?? 0,
      activeSites: siteCount?.count ?? 0,
      activePeople: peopleCount?.count ?? 0,
    })
  } catch (err) {
    console.error('Error getting dashboard stats:', err)
    res.status(500).json({ error: 'Failed to get dashboard stats' })
  }
})

// Recent checks with GPS coordinates (for map)
dashboardRouter.get('/recent-checks', async (req, res) => {
  try {
    const companyId = req.query.companyId as string
    if (!companyId) return res.status(400).json({ error: 'companyId query param required' })

    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)

    const rows = await db
      .select()
      .from(checks)
      .where(and(eq(checks.companyId, companyId), gte(checks.createdAt, yesterday)))
      .orderBy(sql`${checks.createdAt} DESC`)
      .limit(50)

    res.json(rows)
  } catch (err) {
    console.error('Error getting recent checks:', err)
    res.status(500).json({ error: 'Failed to get recent checks' })
  }
})
