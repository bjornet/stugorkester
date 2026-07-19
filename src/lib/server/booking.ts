import { eq } from 'drizzle-orm';
import type { DrizzleDb } from './db/client';
import { booking, ledgerEntry, payment, task } from './db/schema';

/**
 * Delete a booking and everything that references it, atomically. Foreign-key
 * enforcement is on, so the child rows — ledger entries, payments, and linked
 * tasks (e.g. the auto-created cleaning task) — must be removed before the
 * booking itself, or the delete fails with `FOREIGN KEY constraint failed`
 * (#12). The transaction keeps it all-or-nothing.
 */
export function deleteBooking(db: DrizzleDb, id: string): void {
  db.transaction((tx) => {
    tx.delete(ledgerEntry).where(eq(ledgerEntry.bookingId, id)).run();
    tx.delete(payment).where(eq(payment.bookingId, id)).run();
    tx.delete(task).where(eq(task.bookingId, id)).run();
    tx.delete(booking).where(eq(booking.id, id)).run();
  });
}
