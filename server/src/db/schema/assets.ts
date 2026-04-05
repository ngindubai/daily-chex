import {
  pgTable,
  pgEnum,
  uuid,
  text,
  date,
  timestamp,
} from 'drizzle-orm/pg-core'
import { companies } from './companies.js'
import { sites } from './sites.js'
import { people } from './people.js'

export const assetTypeEnum = pgEnum('asset_type', ['vehicle', 'trailer', 'plant'])

export const weightClassEnum = pgEnum('weight_class', ['standard', 'over_7_5t'])

export const assetStatusEnum = pgEnum('asset_status', [
  'active',
  'defective',
  'off_hire',
  'archived',
])

export const assets = pgTable('assets', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull().references(() => companies.id),
  siteId: uuid('site_id').references(() => sites.id),
  assignedToId: uuid('assigned_to_id').references(() => people.id),
  type: assetTypeEnum('type').notNull(),
  name: text('name').notNull(),
  plantId: text('plant_id'),
  serialNumber: text('serial_number'),
  registration: text('registration'),
  supplier: text('supplier'),
  category: text('category'),
  weightClass: weightClassEnum('weight_class').default('standard'),
  calibrationDue: date('calibration_due'),
  nextService: date('next_service'),
  qrCode: text('qr_code').unique(),
  photoUrl: text('photo_url'),
  status: assetStatusEnum('status').notNull().default('active'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})
