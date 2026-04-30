import { Router } from 'express'
import { db } from '../db/index.js'
import { assets } from '../db/schema/index.js'
import { eq } from 'drizzle-orm'
import { v4 as uuidv4 } from 'uuid'
import { requireAuth } from '../auth/middleware.js'
import multer from 'multer'
import { cloudinary } from '../lib/cloudinary.js'

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } })

export const assetsRouter = Router()

function generateQrCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = 'CHX-'
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

// List assets (filter by companyId, siteId, assignedToId)
assetsRouter.get('/', async (req, res) => {
  try {
    const companyId = req.query.companyId as string
    const siteId = req.query.siteId as string
    const assignedToId = req.query.assignedToId as string

    if (assignedToId) {
      const rows = await db.select().from(assets).where(eq(assets.assignedToId, assignedToId))
      return res.json(rows)
    }
    if (siteId) {
      const rows = await db.select().from(assets).where(eq(assets.siteId, siteId))
      return res.json(rows)
    }
    if (companyId) {
      const rows = await db.select().from(assets).where(eq(assets.companyId, companyId))
      return res.json(rows)
    }
    return res.status(400).json({ error: 'companyId, siteId, or assignedToId query param required' })
  } catch (err) {
    console.error('Error listing assets:', err)
    res.status(500).json({ error: 'Failed to list assets' })
  }
})

// Lookup asset by QR code (MUST be before /:id to avoid path conflict)
assetsRouter.get('/qr/:code', async (req, res) => {
  try {
    const [row] = await db.select().from(assets).where(eq(assets.qrCode, req.params.code))
    if (!row) return res.status(404).json({ error: 'Asset not found for QR code' })
    res.json(row)
  } catch (err) {
    console.error('Error looking up QR:', err)
    res.status(500).json({ error: 'Failed to look up QR code' })
  }
})

// Get asset by ID
assetsRouter.get('/:id', async (req, res) => {
  try {
    const [row] = await db.select().from(assets).where(eq(assets.id, req.params.id))
    if (!row) return res.status(404).json({ error: 'Asset not found' })
    res.json(row)
  } catch (err) {
    console.error('Error getting asset:', err)
    res.status(500).json({ error: 'Failed to get asset' })
  }
})

// Create asset
assetsRouter.post('/', async (req, res) => {
  try {
    const {
      companyId, siteId, assignedToId, type, name, plantId, serialNumber,
      registration, supplier, category, weightClass,
      calibrationDue, nextService, notes,
    } = req.body
    if (!companyId || !type || !name) {
      return res.status(400).json({ error: 'companyId, type, and name are required' })
    }

    const qrCode = generateQrCode()
    const [row] = await db
      .insert(assets)
      .values({
        companyId, siteId, assignedToId, type, name, plantId, serialNumber,
        registration, supplier, category, weightClass,
        calibrationDue, nextService, qrCode, notes,
      })
      .returning()
    res.status(201).json(row)
  } catch (err) {
    console.error('Error creating asset:', err)
    res.status(500).json({ error: 'Failed to create asset' })
  }
})

// Update asset
assetsRouter.patch('/:id', async (req, res) => {
  try {
    const {
      type, siteId, assignedToId, name, plantId, serialNumber, registration,
      supplier, category, weightClass, calibrationDue,
      nextService, status, notes, photoUrl,
    } = req.body
    const [row] = await db
      .update(assets)
      .set({
        ...(type !== undefined ? { type } : {}),
        siteId, assignedToId, name, plantId, serialNumber, registration,
        supplier, category, weightClass, calibrationDue,
        nextService, status, notes, photoUrl, updatedAt: new Date(),
      })
      .where(eq(assets.id, req.params.id))
      .returning()
    if (!row) return res.status(404).json({ error: 'Asset not found' })
    res.json(row)
  } catch (err) {
    console.error('Error updating asset:', err)
    res.status(500).json({ error: 'Failed to update asset' })
  }
})

// Transfer asset to a different site
assetsRouter.post('/:id/transfer', async (req, res) => {
  try {
    const { siteId } = req.body
    if (!siteId) return res.status(400).json({ error: 'siteId is required' })

    const [row] = await db
      .update(assets)
      .set({ siteId, updatedAt: new Date() })
      .where(eq(assets.id, req.params.id))
      .returning()
    if (!row) return res.status(404).json({ error: 'Asset not found' })
    res.json(row)
  } catch (err) {
    console.error('Error transferring asset:', err)
    res.status(500).json({ error: 'Failed to transfer asset' })
  }
})

// Assign asset to a person (team leader)
assetsRouter.post('/:id/assign', async (req, res) => {
  try {
    const { assignedToId } = req.body
    const [row] = await db
      .update(assets)
      .set({ assignedToId: assignedToId || null, updatedAt: new Date() })
      .where(eq(assets.id, req.params.id))
      .returning()
    if (!row) return res.status(404).json({ error: 'Asset not found' })
    res.json(row)
  } catch (err) {
    console.error('Error assigning asset:', err)
    res.status(500).json({ error: 'Failed to assign asset' })
  }
})

// Upload photo (multipart/form-data, field: photo)
assetsRouter.post('/:id/photo', requireAuth, upload.single('photo'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file provided' })
  const assetId = req.params.id as string
  try {
    const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          folder: 'daily-chex',
          resource_type: 'image',
          transformation: [{ width: 1200, crop: 'limit', quality: 'auto:good' }],
        },
        (error, result) => {
          if (error || !result) return reject(error || new Error('Upload failed'))
          resolve(result as { secure_url: string })
        },
      ).end(req.file!.buffer)
    })

    const [row] = await db
      .update(assets)
      .set({ photoUrl: result.secure_url, updatedAt: new Date() })
      .where(eq(assets.id, assetId))
      .returning()
    if (!row) return res.status(404).json({ error: 'Asset not found' })
    res.json(row)
  } catch (err) {
    console.error('Error uploading photo:', err)
    res.status(500).json({ error: 'Failed to upload photo' })
  }
})
