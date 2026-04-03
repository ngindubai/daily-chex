import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  numeric,
  boolean,
  date,
  timestamp,
} from 'drizzle-orm/pg-core'
import { companies } from './companies.js'
import { assets } from './assets.js'
import { people } from './people.js'
import { sites } from './sites.js'
import { teams } from './teams.js'
import { checkTemplates } from './checkTemplates.js'

export const checkStatusEnum = pgEnum('check_status', [
  'in_progress',
  'completed',
  'abandoned',
])

export const checkResultEnum = pgEnum('check_result', ['pass', 'fail'])

export const checks = pgTable('checks', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull().references(() => companies.id),
  assetId: uuid('asset_id').notNull().references(() => assets.id),
  personId: uuid('person_id').notNull().references(() => people.id),
  siteId: uuid('site_id').references(() => sites.id),
  teamId: uuid('team_id').references(() => teams.id),
  checkTemplateId: uuid('check_template_id').notNull().references(() => checkTemplates.id),
  status: checkStatusEnum('status').notNull().default('in_progress'),
  overallResult: checkResultEnum('overall_result'),
  mileageStart: integer('mileage_start'),
  mileageEnd: integer('mileage_end'),
  placePurked: text('place_parked'),
  notes: text('notes'),
  signatureUrl: text('signature_url'),
  agentSignature: text('agent_signature'),
  businessMileageConfirmed: boolean('business_mileage_confirmed').default(false),
  weekEnding: date('week_ending'),
  // GPS fields — captured at check start and completion
  startLat: numeric('start_lat', { precision: 10, scale: 7 }),
  startLng: numeric('start_lng', { precision: 10, scale: 7 }),
  startAccuracy: numeric('start_accuracy', { precision: 8, scale: 2 }),
  endLat: numeric('end_lat', { precision: 10, scale: 7 }),
  endLng: numeric('end_lng', { precision: 10, scale: 7 }),
  endAccuracy: numeric('end_accuracy', { precision: 8, scale: 2 }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})
