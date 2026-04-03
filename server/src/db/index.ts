import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema/index.js'

const connectionString = process.env.DATABASE_URL || 'postgresql://localhost:5432/daily_chex'
const isRemote = connectionString.includes('neon.tech') || connectionString.includes('sslmode')

const client = postgres(connectionString, { ssl: isRemote ? 'require' : false })

export const db = drizzle(client, { schema })

export type Database = typeof db
