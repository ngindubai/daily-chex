/**
 * Safe seed — only inserts data if the database needs it.
 * Runs at startup in production so the demo always has data.
 * Checks both that data exists AND that PINs are properly bcrypt-hashed.
 * Uses its own DB connection (not the shared singleton) so it can close cleanly.
 */
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { companies, people } from './schema/index.js'
import { count, sql as dsql } from 'drizzle-orm'

const connectionString = process.env.DATABASE_URL || 'postgresql://localhost:5432/daily_chex'
const isRemote = connectionString.includes('neon.tech') || connectionString.includes('sslmode')

async function run() {
  const client = postgres(connectionString, { max: 1, ssl: isRemote ? 'require' : false })
  const db = drizzle(client)

  try {
    const [companyResult] = await db.select({ count: count() }).from(companies)
    const companyCount = companyResult?.count ?? 0

    if (companyCount > 0) {
      // Companies exist — verify people with properly hashed PINs also exist
      // bcrypt hashes are 60 chars; plain text PINs are 4 chars
      const [pinCheck] = await db
        .select({ count: count() })
        .from(people)
        .where(dsql`LENGTH(${people.pin}) >= 50`)

      if ((pinCheck?.count ?? 0) > 0) {
        console.log('Database has valid data, skipping seed.')
        await client.end()
        return
      }

      // Data exists but PINs are missing or unhashed — wipe and reseed
      console.log('Database has corrupt data (unhashed PINs). Clearing for reseed...')
      await client`TRUNCATE companies CASCADE`
      console.log('Tables cleared.')
    }
  } catch {
    console.log('Could not check database state, skipping seed.')
    await client.end()
    return
  }

  await client.end()

  console.log('Seeding database...')
  // Dynamic import runs the full seed (which uses its own connection via db/index.js)
  await import('./seed.js')
}

run().catch((err) => {
  console.error('Safe seed failed:', err)
  process.exit(1)
})
