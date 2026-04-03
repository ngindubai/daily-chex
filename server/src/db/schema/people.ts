import {
  pgTable,
  pgEnum,
  uuid,
  text,
  timestamp,
} from 'drizzle-orm/pg-core'
import { companies } from './companies.js'
import { teams } from './teams.js'

export const personRoleEnum = pgEnum('person_role', [
  'operator',
  'supervisor',
  'manager',
  'admin',
])

export const personStatusEnum = pgEnum('person_status', ['active', 'archived'])

export const people = pgTable('people', {
  id: uuid('id').primaryKey().defaultRandom(),
  companyId: uuid('company_id').notNull().references(() => companies.id),
  teamId: uuid('team_id').references(() => teams.id),
  firstName: text('first_name').notNull(),
  lastName: text('last_name').notNull(),
  phone: text('phone'),
  email: text('email'),
  role: personRoleEnum('role').notNull().default('operator'),
  licenceNo: text('licence_no'),
  pin: text('pin'), // hashed
  status: personStatusEnum('status').notNull().default('active'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})
