import { Router, Request, Response, NextFunction } from 'express'
import { db } from '../db/index.js'
import { companies, people, assets, sites, teams } from '../db/schema/index.js'
import { eq, count, sql } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'

export const adminRouter = Router()

// Guard: all /admin routes require SUPER_ADMIN_KEY in Authorization header
function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const key = process.env.SUPER_ADMIN_KEY
  if (!key) return res.status(503).json({ error: 'Admin not configured' })
  const auth = req.headers.authorization
  if (!auth || auth !== `Bearer ${key}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }
  next()
}

adminRouter.use(requireAdmin)

// GET /admin/companies — list all with counts
adminRouter.get('/companies', async (_req, res) => {
  try {
    const rows = await db.select().from(companies).orderBy(companies.createdAt)

    const withStats = await Promise.all(
      rows.map(async (c) => {
        const [[pc], [ac], [sc]] = await Promise.all([
          db.select({ n: count() }).from(people).where(eq(people.companyId, c.id)),
          db.select({ n: count() }).from(assets).where(eq(assets.companyId, c.id)),
          db.select({ n: count() }).from(sites).where(eq(sites.companyId, c.id)),
        ])
        return { ...c, peopleCount: pc.n, assetCount: ac.n, siteCount: sc.n }
      })
    )

    res.json(withStats)
  } catch (err) {
    console.error('Admin list companies error:', err)
    res.status(500).json({ error: 'Failed to list companies' })
  }
})

// POST /admin/companies — create company
adminRouter.post('/companies', async (req, res) => {
  try {
    const { name, slug } = req.body
    if (!name || !slug) return res.status(400).json({ error: 'name and slug required' })
    const clean = slug.toLowerCase().replace(/[^a-z0-9-]/g, '-')
    const [row] = await db.insert(companies).values({ name, slug: clean }).returning()
    res.status(201).json(row)
  } catch (err: any) {
    if (err?.code === '23505') return res.status(409).json({ error: 'Slug already in use' })
    console.error('Admin create company error:', err)
    res.status(500).json({ error: 'Failed to create company' })
  }
})

// PATCH /admin/companies/:id — rename company
adminRouter.patch('/companies/:id', async (req, res) => {
  try {
    const { name, slug } = req.body
    const companyId = req.params.id as string
    const updates: Record<string, unknown> = { updatedAt: new Date() }
    if (name) updates.name = name
    if (slug) updates.slug = slug.toLowerCase().replace(/[^a-z0-9-]/g, '-')
    const [row] = await db.update(companies).set(updates).where(eq(companies.id, companyId)).returning()
    if (!row) return res.status(404).json({ error: 'Company not found' })
    res.json(row)
  } catch (err: any) {
    if (err?.code === '23505') return res.status(409).json({ error: 'Slug already in use' })
    console.error('Admin update company error:', err)
    res.status(500).json({ error: 'Failed to update company' })
  }
})

// DELETE /admin/companies/:id — only allowed if no child rows
adminRouter.delete('/companies/:id', async (req, res) => {
  try {
    const companyId = req.params.id as string
    // Check for dependents
    const [[pc]] = await Promise.all([
      db.select({ n: count() }).from(people).where(eq(people.companyId, companyId)),
    ])
    if (Number(pc.n) > 0) {
      return res.status(409).json({
        error: `Cannot delete: company has ${pc.n} people. Remove all data first.`,
      })
    }
    const [row] = await db.delete(companies).where(eq(companies.id, companyId)).returning()
    if (!row) return res.status(404).json({ error: 'Company not found' })
    res.json({ ok: true })
  } catch (err) {
    console.error('Admin delete company error:', err)
    res.status(500).json({ error: 'Failed to delete company' })
  }
})
