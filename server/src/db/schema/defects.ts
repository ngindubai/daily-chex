import {
  pgTable,
  pgEnum,
  uuid,
  text,
  timestamp,
} from 'drizzle-orm/pg-core'
import { companies } from './companies.js'
import { checks } from './checks.js'
import { assets } from './assets.js'
import { people } from './people.js'

export const defectSeverityEnum = pgEnum('defect_severity', [
  'low',
  'medium',
  'high',
  'critical',
])

export const defectStatusEnum = pgEnum('defect_status', [
  'open',
  'in_progress',
  'resolved',
  'accepted',
])

export const defects = pgTable('defects', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull().references(() => companies.id),
  checkId: uuid('check_id').references(() => checks.id),
  assetId: uuid('asset_id').notNull().references(() => assets.id),
  reportedBy: uuid('reported_by').notNull().references(() => people.id),
  description: text('description').notNull(),
  severity: defectSeverityEnum('severity').notNull().default('medium'),
  status: defectStatusEnum('status').notNull().default('open'),
  actionTaken: text('action_taken'),
  resolvedBy: uuid('resolved_by').references(() => people.id),
  resolvedAt: timestamp('resolved_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})
