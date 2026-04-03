/**
 * Safe seed — only inserts data if the company table is empty.
 * Runs at startup in production so the demo always has data.
 */
import { db } from './index.js'
import { companies } from './schema/index.js'
import { count } from 'drizzle-orm'

async function shouldSeed(): Promise<boolean> {
  try {
    const [result] = await db.select({ count: count() }).from(companies)
    return (result?.count ?? 0) === 0
  } catch {
    // Table might not exist yet (migration hasn't run), skip
    return false
  }
}

async function run() {
  const empty = await shouldSeed()
  if (!empty) {
    console.log('Database already has data, skipping seed.')
    process.exit(0)
  }

  console.log('Empty database detected, seeding...')

  // Dynamic import so we don't execute the full seed at module load time
  await import('./seed.js')
}

run().catch((err) => {
  console.error('Safe seed failed:', err)
  process.exit(1)
})
