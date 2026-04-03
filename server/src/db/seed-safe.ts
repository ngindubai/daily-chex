/**
 * Safe seed — only inserts data if the company table is empty.
 * Runs at startup in production so the demo always has data.
 * Uses its own DB connection (not the shared singleton) so it can close cleanly.
 */
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { companies } from './schema/index.js'
import { count } from 'drizzle-orm'

const connectionString = process.env.DATABASE_URL || 'postgresql://localhost:5432/daily_chex'

async function run() {
  const client = postgres(connectionString, { max: 1 })
  const db = drizzle(client)

  try {
    const [result] = await db.select({ count: count() }).from(companies)
    const isEmpty = (result?.count ?? 0) === 0

    if (!isEmpty) {
      console.log('Database already has data, skipping seed.')
      await client.end()
      return
    }
  } catch {
    console.log('Could not check database state, skipping seed.')
    await client.end()
    return
  }

  await client.end()

  console.log('Empty database detected, seeding...')
  // Dynamic import runs the full seed (which uses its own connection via db/index.js)
  await import('./seed.js')
}

run().catch((err) => {
  console.error('Safe seed failed:', err)
  process.exit(1)
})
