import {
  pgTable,
  pgEnum,
  uuid,
  text,
  numeric,
  timestamp,
} from 'drizzle-orm/pg-core'
import { companies } from './companies.js'

export const siteStatusEnum = pgEnum('site_status', ['active', 'archived'])

export const sites = pgTable('sites', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull().references(() => companies.id),
  name: text('name').notNull(),
  address: text('address'),
  postcode: text('postcode'),
  lat: numeric('lat', { precision: 10, scale: 7 }),
  lng: numeric('lng', { precision: 10, scale: 7 }),
  status: siteStatusEnum('status').notNull().default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})
