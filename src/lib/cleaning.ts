// The cleaning-task rule (design §4.5): a confirmed booking gets a cleaning
// task whose deadline tracks the checkout. Pure and client-safe so the rule
// can be unit-tested without a database.
import type { BookingStatus } from './booking-status';

// A cleaning task is warranted once a booking is at least confirmed. Tentative
// holds (inquiry/offered) don't yet commit the cabin, so they get none.
const CLEANING_FROM_STATUSES = new Set<BookingStatus>([
  'confirmed',
  'checked_in',
  'checked_out',
  'completed'
]);

export function shouldHaveCleaningTask(status: BookingStatus): boolean {
  return CLEANING_FROM_STATUSES.has(status);
}

/**
 * When the cleaning must be done by: the checkout (turnaround) day. For a
 * same-day turnaround this is exactly the next guest's check-in, matching the
 * design's "deadline = next check-in".
 */
export function cleaningTaskDueDate(checkOut: string): string {
  return checkOut;
}

/** Default title for an auto-created cleaning task. */
export function cleaningTaskTitle(guestName: string | null | undefined): string {
  return `Cleaning after ${guestName ?? 'guest'} checkout`;
}
