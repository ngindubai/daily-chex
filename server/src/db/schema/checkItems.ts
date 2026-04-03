import {
  pgTable,
  pgEnum,
  uuid,
  text,
  smallint,
  timestamp,
} from 'drizzle-orm/pg-core'
import { checks } from './checks.js'
import { checkTemplateItems } from './checkTemplates.js'

export const checkItemResultEnum = pgEnum('check_item_result', ['pass', 'fail', 'na'])

export const checkItems = pgTable('check_items', {
  id: uuid('id').primaryKey().defaultRandom(),
  checkId: uuid('check_id').notNull().references(() => checks.id, { onDelete: 'cascade' }),
  templateItemId: uuid('template_item_id').notNull().references(() => checkTemplateItems.id),
  dayOfWeek: smallint('day_of_week'), // 0=Mon, 6=Sun, null for non-grid checks
  result: checkItemResultEnum('result'),
  notes: text('notes'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
