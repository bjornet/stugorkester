import { relations, sql } from 'drizzle-orm';
import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';
// Relative import (not $lib) so the standalone seed script — which runs under
// plain Node without SvelteKit's Vite resolver — can load this file too.
import { bookingStatusValues } from '../../booking-status.ts';
import { taskStatusValues, taskTypeValues } from '../../task-enums.ts';

export { bookingStatusValues, taskStatusValues, taskTypeValues };

const id = () =>
  text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());

const timestamps = {
  createdAt: text('created_at')
    .notNull()
    .default(sql`(current_timestamp)`),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`(current_timestamp)`)
};

export const property = sqliteTable('property', {
  id: id(),
  name: text('name').notNull(),
  description: text('description'),
  houseRules: text('house_rules'),
  ...timestamps
});

export const channel = sqliteTable('channel', {
  id: id(),
  name: text('name').notNull().unique(),
  supportsPayment: integer('supports_payment', { mode: 'boolean' }).notNull().default(false),
  contractCoverage: text('contract_coverage', { enum: ['full', 'partial', 'none'] })
    .notNull()
    .default('none'),
  hasInsurance: integer('has_insurance', { mode: 'boolean' }).notNull().default(false),
  handlesCleaning: integer('handles_cleaning', { mode: 'boolean' }).notNull().default(false),
  syncType: text('sync_type', { enum: ['ical', 'manual'] })
    .notNull()
    .default('manual'),
  commissionRate: real('commission_rate'),
  notes: text('notes'),
  ...timestamps
});

export const guest = sqliteTable('guest', {
  id: id(),
  name: text('name').notNull(),
  email: text('email'),
  phone: text('phone'),
  notes: text('notes'),
  ...timestamps
});

export const booking = sqliteTable('booking', {
  id: id(),
  propertyId: text('property_id')
    .notNull()
    .references(() => property.id),
  channelId: text('channel_id')
    .notNull()
    .references(() => channel.id),
  guestId: text('guest_id').references(() => guest.id),
  status: text('status', { enum: bookingStatusValues }).notNull().default('inquiry'),
  checkIn: text('check_in').notNull(),
  checkOut: text('check_out').notNull(),
  basePrice: real('base_price'),
  cleaningFee: real('cleaning_fee'),
  totalPrice: real('total_price'),
  cancellationPolicy: text('cancellation_policy'),
  isShadow: integer('is_shadow', { mode: 'boolean' }).notNull().default(false),
  externalRef: text('external_ref'),
  ...timestamps
});

export const payment = sqliteTable('payment', {
  id: id(),
  bookingId: text('booking_id')
    .notNull()
    .references(() => booking.id),
  type: text('type', { enum: ['guest_payment', 'payout'] }).notNull(),
  amount: real('amount').notNull(),
  dueDate: text('due_date'),
  status: text('status', { enum: ['pending', 'paid', 'overdue'] })
    .notNull()
    .default('pending'),
  paidAt: text('paid_at'),
  notes: text('notes'),
  ...timestamps
});

export const blocking = sqliteTable('blocking', {
  id: id(),
  propertyId: text('property_id')
    .notNull()
    .references(() => property.id),
  startDate: text('start_date').notNull(),
  endDate: text('end_date').notNull(),
  reason: text('reason'),
  ...timestamps
});

export const task = sqliteTable('task', {
  id: id(),
  propertyId: text('property_id')
    .notNull()
    .references(() => property.id),
  bookingId: text('booking_id').references(() => booking.id),
  type: text('type', { enum: taskTypeValues }).notNull(),
  title: text('title').notNull(),
  description: text('description'),
  dueDate: text('due_date'),
  status: text('status', { enum: taskStatusValues }).notNull().default('pending'),
  assignee: text('assignee'),
  ...timestamps
});

export const ledgerEntry = sqliteTable('ledger_entry', {
  id: id(),
  propertyId: text('property_id')
    .notNull()
    .references(() => property.id),
  channelId: text('channel_id')
    .notNull()
    .references(() => channel.id),
  bookingId: text('booking_id').references(() => booking.id),
  type: text('type', { enum: ['income', 'commission', 'net'] }).notNull(),
  amount: real('amount').notNull(),
  occurredAt: text('occurred_at').notNull(),
  notes: text('notes'),
  ...timestamps
});

export const propertyRelations = relations(property, ({ many }) => ({
  bookings: many(booking),
  blockings: many(blocking),
  tasks: many(task),
  ledgerEntries: many(ledgerEntry)
}));

export const channelRelations = relations(channel, ({ many }) => ({
  bookings: many(booking),
  ledgerEntries: many(ledgerEntry)
}));

export const guestRelations = relations(guest, ({ many }) => ({
  bookings: many(booking)
}));

export const bookingRelations = relations(booking, ({ one, many }) => ({
  property: one(property, { fields: [booking.propertyId], references: [property.id] }),
  channel: one(channel, { fields: [booking.channelId], references: [channel.id] }),
  guest: one(guest, { fields: [booking.guestId], references: [guest.id] }),
  payments: many(payment),
  tasks: many(task),
  ledgerEntries: many(ledgerEntry)
}));

export const paymentRelations = relations(payment, ({ one }) => ({
  booking: one(booking, { fields: [payment.bookingId], references: [booking.id] })
}));

export const blockingRelations = relations(blocking, ({ one }) => ({
  property: one(property, { fields: [blocking.propertyId], references: [property.id] })
}));

export const taskRelations = relations(task, ({ one }) => ({
  property: one(property, { fields: [task.propertyId], references: [property.id] }),
  booking: one(booking, { fields: [task.bookingId], references: [booking.id] })
}));

export const ledgerEntryRelations = relations(ledgerEntry, ({ one }) => ({
  property: one(property, { fields: [ledgerEntry.propertyId], references: [property.id] }),
  channel: one(channel, { fields: [ledgerEntry.channelId], references: [channel.id] }),
  booking: one(booking, { fields: [ledgerEntry.bookingId], references: [booking.id] })
}));
