import { Router } from 'express'
import { db } from '../db/index.js'
import { sites, teams, people, assets } from '../db/schema/index.js'
import { eq, and, sql, count } from 'drizzle-orm'

export const sitesRouter = Router()

// List sites for a company (with team/people/asset counts)
sitesRouter.get('/', async (req, res) => {
  try {
    const companyId = req.query.companyId as string
    if (!companyId) return res.status(400).json({ error: 'companyId query param required' })

    const rows = await db.select().from(sites).where(eq(sites.companyId, companyId))

    // Get counts in parallel
    const [teamCounts, peopleCounts, assetCounts] = await Promise.all([
      db
        .select({ siteId: teams.siteId, count: count() })
        .from(teams)
        .where(eq(teams.companyId, companyId))
        .groupBy(teams.siteId),
      db
        .select({ teamId: people.teamId, count: count() })
        .from(people)
        .where(eq(people.companyId, companyId))
        .groupBy(people.teamId),
      db
        .select({ siteId: assets.siteId, count: count() })
        .from(assets)
        .where(eq(assets.companyId, companyId))
        .groupBy(assets.siteId),
    ])

    // Map team → site for people count
    const siteTeams = await db
      .select({ id: teams.id, siteId: teams.siteId })
      .from(teams)
      .where(eq(teams.companyId, companyId))

    const teamToSite = new Map(siteTeams.map((t) => [t.id, t.siteId]))

    const peopleBySite = new Map<string, number>()
    for (const pc of peopleCounts) {
      if (!pc.teamId) continue
      const siteId = teamToSite.get(pc.teamId)
      if (siteId) peopleBySite.set(siteId, (peopleBySite.get(siteId) || 0) + pc.count)
    }

    const teamsBySite = new Map(teamCounts.map((t) => [t.siteId, t.count]))
    const assetsBySite = new Map(assetCounts.map((a) => [a.siteId, a.count]))

    const enriched = rows.map((site) => ({
      ...site,
      teamCount: teamsBySite.get(site.id) || 0,
      peopleCount: peopleBySite.get(site.id) || 0,
      assetCount: assetsBySite.get(site.id) || 0,
    }))

    res.json(enriched)
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
