import express from 'express'
import cors from 'cors'
import path from 'path'
import { fileURLToPath } from 'url'
import { healthRouter } from './routes/health.js'
import { companiesRouter } from './routes/companies.js'
import { sitesRouter } from './routes/sites.js'
import { teamsRouter } from './routes/teams.js'
import { peopleRouter } from './routes/people.js'
import { assetsRouter } from './routes/assets.js'
import { checkTemplatesRouter } from './routes/checkTemplates.js'
import { checksRouter } from './routes/checks.js'
import { defectsRouter } from './routes/defects.js'
import { dashboardRouter } from './routes/dashboard.js'
import { taskAssignmentsRouter } from './routes/taskAssignments.js'
import { authRouter } from './routes/auth.js'
import { adminRouter } from './routes/admin.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = parseInt(process.env.PORT || '3200', 10)

// Middleware
app.use(cors())
app.use(express.json({ limit: '5mb' }))

// Request logging
app.use((req, _res, next) => {
  const start = Date.now()
  _res.on('finish', () => {
    const ms = Date.now() - start
    console.log(`${req.method} ${req.path} ${_res.statusCode} ${ms}ms`)
  })
  next()
})

// API Routes
app.use('/api', healthRouter)
app.use('/api/auth', authRouter)
app.use('/api/companies', companiesRouter)
app.use('/api/sites', sitesRouter)
app.use('/api/teams', teamsRouter)
app.use('/api/people', peopleRouter)
app.use('/api/assets', assetsRouter)
app.use('/api/check-templates', checkTemplatesRouter)
app.use('/api/checks', checksRouter)
app.use('/api/defects', defectsRouter)
app.use('/api/dashboard', dashboardRouter)
app.use('/api/task-assignments', taskAssignmentsRouter)
app.use('/api/admin', adminRouter)

// Serve React frontend (production)
const clientDist = path.resolve(__dirname, '../../app/dist')
app.use(express.static(clientDist))

// SPA fallback: any non-API route serves index.html
app.get('/{*splat}', (_req, res, next) => {
  if (_req.path.startsWith('/api')) return next()
  res.sendFile(path.join(clientDist, 'index.html'))
})

// 404 for unmatched API routes
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' })
})

// Error handler
app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err)
  res.status(500).json({ error: 'Internal server error' })
})

app.listen(PORT, () => {
  console.log(`Daily-Chex running on http://localhost:${PORT}`)
  console.log(`API: http://localhost:${PORT}/api/health`)
})

export default app
