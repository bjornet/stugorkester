import { describe, it, expect } from 'vitest';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { eq } from 'drizzle-orm';
import { mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { createDb } from './db/client';
import { deleteBooking } from './booking';
import { booking, channel, ledgerEntry, payment, property, task } from './db/schema';

// A schema'd file DB opened exactly like the app (createDb). Foreign-key
// enforcement is on for this connection, so this reproduces the runtime the
// SvelteKit delete action actually runs against (#12).
function setupDb() {
  const dir = mkdtempSync(join(tmpdir(), 'booking-test-'));
  const file = join(dir, 'test.db');
  migrate(drizzle(new Database(file)), { migrationsFolder: 'drizzle' });
  return createDb(file);
}

describe('deleteBooking', () => {
  it('deletes a booking and all rows referencing it, without an FK error', () => {
    const db = setupDb();
    const p = db.insert(property).values({ name: 'P' }).returning({ id: property.id }).get();
    const c = db.insert(channel).values({ name: 'Ch' }).returning({ id: channel.id }).get();
    const b = db
      .insert(booking)
      .values({
        propertyId: p.id,
        channelId: c.id,
        status: 'confirmed',
        checkIn: '2026-08-01',
        checkOut: '2026-08-05'
      })
      .returning({ id: booking.id })
      .get();

    // Every kind of row that references the booking via a foreign key.
    db.insert(task)
      .values({ propertyId: p.id, bookingId: b.id, type: 'cleaning', title: 'Clean' })
      .run();
    db.insert(payment).values({ bookingId: b.id, type: 'guest_payment', amount: 1000 }).run();
    db.insert(ledgerEntry)
      .values({
        propertyId: p.id,
        channelId: c.id,
        bookingId: b.id,
        type: 'income',
        amount: 1000,
        occurredAt: '2026-08-05'
      })
      .run();

    // Before the fix this threw `FOREIGN KEY constraint failed`.
    expect(() => deleteBooking(db, b.id)).not.toThrow();

    expect(db.select().from(booking).where(eq(booking.id, b.id)).all()).toHaveLength(0);
    expect(db.select().from(task).where(eq(task.bookingId, b.id)).all()).toHaveLength(0);
    expect(db.select().from(payment).where(eq(payment.bookingId, b.id)).all()).toHaveLength(0);
    expect(db.select().from(ledgerEntry).where(eq(ledgerEntry.bookingId, b.id)).all()).toHaveLength(
      0
    );
  });
});
