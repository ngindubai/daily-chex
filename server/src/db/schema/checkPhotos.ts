import {
  pgTable,
  uuid,
  text,
  timestamp,
} from 'drizzle-orm/pg-core'
import { checks } from './checks.js'
import { checkItems } from './checkItems.js'

export const checkPhotos = pgTable('check_photos', {
  id: uuid('id').primaryKey().defaultRandom(),
  checkId: uuid('check_id').notNull().references(() => checks.id, { onDelete: 'cascade' }),
  checkItemId: uuid('check_item_id').references(() => checkItems.id),
  url: text('url').notNull(),
  caption: text('caption'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})
