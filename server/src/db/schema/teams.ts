import {
  pgTable,
  pgEnum,
  uuid,
  text,
  timestamp,
} from 'drizzle-orm/pg-core'
import { companies } from './companies.js'
import { sites } from './sites.js'

export const teamStatusEnum = pgEnum('team_status', ['active', 'archived'])

export const teams = pgTable('teams', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull().references(() => companies.id),
  siteId: uuid('site_id').notNull().references(() => sites.id),
  name: text('name').notNull(),
  leaderId: uuid('leader_id'), // FK to people, added after people table exists
  status: teamStatusEnum('status').notNull().default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})
