import {
  pgTable,
  pgEnum,
  uuid,
  text,
  date,
  timestamp,
} from 'drizzle-orm/pg-core'
import { companies } from './companies.js'
import { assets } from './assets.js'
import { people } from './people.js'
import { teams } from './teams.js'
import { sites } from './sites.js'
import { checkTemplates } from './checkTemplates.js'
import { checks } from './checks.js'

export const taskStatusEnum = pgEnum('task_status', [
  'pending',
  'in_progress',
  'completed',
  'overdue',
  'cancelled',
])

export const taskPriorityEnum = pgEnum('task_priority', [
  'low',
  'normal',
  'high',
  'urgent',
])

export const taskAssignments = pgTable('task_assignments', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull().references(() => companies.id),
  assetId: uuid('asset_id').notNull().references(() => assets.id),
  checkTemplateId: uuid('check_template_id').notNull().references(() => checkTemplates.id),
  assignedTo: uuid('assigned_to').references(() => people.id),
  assignedTeam: uuid('assigned_team').references(() => teams.id),
  siteId: uuid('site_id').references(() => sites.id),
  createdBy: uuid('created_by').notNull().references(() => people.id),
  status: taskStatusEnum('status').notNull().default('pending'),
  priority: taskPriorityEnum('priority').notNull().default('normal'),
  dueDate: date('due_date'),
  notes: text('notes'),
  completedCheckId: uuid('completed_check_id').references(() => checks.id),
  completedAt: timestamp('completed_at', { withTimezone: true }),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})
