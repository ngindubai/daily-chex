import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const connectionString = process.env.DATABASE_URL || 'postgresql://localhost:5432/daily_chex'

async function runMigrations() {
  console.log('Connecting to database for migrations...')
  const client = postgres(connectionString, { max: 1 })
  const db = drizzle(client)

  // Resolve drizzle folder relative to this file's location (dist/db/ -> ../../drizzle)
  const migrationsFolder = path.resolve(__dirname, '../../drizzle')
  console.log('Migrations folder:', migrationsFolder)

  console.log('Running migrations...')
  await migrate(db, { migrationsFolder })
  console.log('Migrations complete.')

  await client.end()
  console.log('Migration DB connection closed.')
}

runMigrations().catch((err) => {
  console.error('Migration failed:', err)
  process.exit(1)
})
