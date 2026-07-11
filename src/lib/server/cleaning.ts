import { db } from './db';
import { booking, task } from './db/schema';
import { cleaningTaskDueDate, cleaningTaskTitle, shouldHaveCleaningTask } from '$lib/cleaning';
import { and, eq, sql } from 'drizzle-orm';

/**
 * Keep a booking's auto cleaning task in step with the booking (design §4.5):
 *
 * - Confirmed (or later) booking without a cleaning task → create one, due on
 *   the checkout day, status pending.
 * - Existing cleaning task → move its due date to match the (possibly changed)
 *   checkout; the title, status and assignee are left alone so manual edits and
 *   cleaner progress survive.
 * - Tentative booking (inquiry/offered) → do nothing; an already-created task
 *   is left in place rather than silently deleted.
 *
 * Idempotent: safe to call after every booking create/update.
 */
export async function syncCleaningTaskForBooking(bookingId: string): Promise<void> {
  const found = await db.query.booking.findFirst({
    where: eq(booking.id, bookingId),
    columns: { id: true, propertyId: true, checkOut: true, status: true },
    with: { guest: { columns: { name: true } } }
  });
  if (!found) return;

  const existing = await db
    .select({ id: task.id })
    .from(task)
    .where(and(eq(task.bookingId, bookingId), eq(task.type, 'cleaning')))
    .get();

  const dueDate = cleaningTaskDueDate(found.checkOut);

  if (existing) {
    await db
      .update(task)
      .set({ dueDate, updatedAt: sql`(current_timestamp)` })
      .where(eq(task.id, existing.id));
    return;
  }

  if (!shouldHaveCleaningTask(found.status)) return;

  await db.insert(task).values({
    propertyId: found.propertyId,
    bookingId: found.id,
    type: 'cleaning',
    title: cleaningTaskTitle(found.guest?.name),
    dueDate,
    status: 'pending'
  });
}
