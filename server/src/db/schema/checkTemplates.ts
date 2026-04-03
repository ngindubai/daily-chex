import {
  pgTable,
  pgEnum,
  uuid,
  text,
  integer,
  smallint,
  boolean,
  date,
  timestamp,
} from 'drizzle-orm/pg-core'
import { companies } from './companies.js'

export const checkFrequencyEnum = pgEnum('check_frequency', ['daily', 'weekly'])

export const checkTemplates = pgTable('check_templates', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').references(() => companies.id), // null = global
  name: text('name').notNull(),
  slug: text('slug'),
  assetType: text('asset_type').notNull(), // vehicle, trailer, plant
  checkFrequency: checkFrequencyEnum('check_frequency').notNull(),
  description: text('description'),
  version: integer('version').notNull().default(1),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

export const checkTemplateItems = pgTable('check_template_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  templateId: uuid('template_id').notNull().references(() => checkTemplates.id),
  section: text('section'),
  label: text('label').notNull(),
  sortOrder: smallint('sort_order').notNull().default(0),
  isRequired: boolean('is_required').notNull().default(true),
  appliesWhen: text('applies_when'), // JSON string for conditional logic
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
