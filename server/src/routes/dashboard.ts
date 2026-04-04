import { Router } from 'express'
import { db } from '../db/index.js'
import { checks, assets, defects, sites, people, teams } from '../db/schema/index.js'
import { eq, and, sql, gte, lte, count, desc } from 'drizzle-orm'

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

    // Critical defects
    const [criticalDefects] = await db
      .select({ count: count() })
      .from(defects)
      .where(and(eq(defects.companyId, companyId), eq(defects.status, 'open'), eq(defects.severity, 'critical')))

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

    // Defective assets count
    const [defectiveAssets] = await db
      .select({ count: count() })
      .from(assets)
      .where(and(eq(assets.companyId, companyId), eq(assets.status, 'defective')))

    // Calibrations due in next 14 days
    const in14Days = new Date()
    in14Days.setDate(in14Days.getDate() + 14)
    const todayStr = today.toISOString().split('T')[0]
    const in14Str = in14Days.toISOString().split('T')[0]

    const calibrationsDue = await db
      .select({ id: assets.id, name: assets.name, calibrationDue: assets.calibrationDue })
      .from(assets)
      .where(and(
        eq(assets.companyId, companyId),
        eq(assets.status, 'active'),
        gte(assets.calibrationDue, todayStr),
        lte(assets.calibrationDue, in14Str),
      ))
      .orderBy(assets.calibrationDue)

    res.json({
      totalAssets: assetCount?.count ?? 0,
      checksToday: checksToday?.count ?? 0,
      openDefects: openDefects?.count ?? 0,
      criticalDefects: criticalDefects?.count ?? 0,
      activeSites: siteCount?.count ?? 0,
      activePeople: peopleCount?.count ?? 0,
      defectiveAssets: defectiveAssets?.count ?? 0,
      calibrationsDue,
    })
  } catch (err) {
    console.error('Error getting dashboard stats:', err)
    res.status(500).json({ error: 'Failed to get dashboard stats' })
  }
})

// Defect severity breakdown
dashboardRouter.get('/defect-breakdown', async (req, res) => {
  try {
    const companyId = req.query.companyId as string
    if (!companyId) return res.status(400).json({ error: 'companyId query param required' })

    const rows = await db
      .select({ severity: defects.severity, count: count() })
      .from(defects)
      .where(and(eq(defects.companyId, companyId), eq(defects.status, 'open')))
      .groupBy(defects.severity)

    const breakdown: Record<string, number> = { critical: 0, high: 0, medium: 0, low: 0 }
    for (const row of rows) breakdown[row.severity] = row.count
    res.json(breakdown)
  } catch (err) {
    console.error('Error getting defect breakdown:', err)
    res.status(500).json({ error: 'Failed to get defect breakdown' })
  }
})

// Site-level stats
dashboardRouter.get('/site-stats', async (req, res) => {
  try {
    const companyId = req.query.companyId as string
    if (!companyId) return res.status(400).json({ error: 'companyId query param required' })

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    const allSites = await db.select().from(sites)
      .where(and(eq(sites.companyId, companyId), eq(sites.status, 'active')))

    const results = []
    for (const site of allSites) {
      const [assetCount] = await db.select({ count: count() }).from(assets)
        .where(and(eq(assets.siteId, site.id), eq(assets.status, 'active')))

      const [checksCount] = await db.select({ count: count() }).from(checks)
        .where(and(eq(checks.siteId, site.id), gte(checks.createdAt, today)))

      const [defectCount] = await db.select({ count: count() }).from(defects)
        .where(and(eq(defects.companyId, companyId), eq(defects.status, 'open')))

      const [teamCount] = await db.select({ count: count() }).from(teams)
        .where(eq(teams.siteId, site.id))

      results.push({
        id: site.id,
        name: site.name,
        assets: assetCount?.count ?? 0,
        checksToday: checksCount?.count ?? 0,
        openDefects: defectCount?.count ?? 0,
        teams: teamCount?.count ?? 0,
      })
    }

    res.json(results)
  } catch (err) {
    console.error('Error getting site stats:', err)
    res.status(500).json({ error: 'Failed to get site stats' })
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
      .orderBy(desc(checks.createdAt))
      .limit(50)

    res.json(rows)
  } catch (err) {
    console.error('Error getting recent checks:', err)
    res.status(500).json({ error: 'Failed to get recent checks' })
  }
})
