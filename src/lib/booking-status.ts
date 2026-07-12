// Client-safe source of truth for booking status values. The Drizzle schema
// re-exports these so the enum stays defined in exactly one place.

export const bookingStatusValues = [
  'inquiry',
  'offered',
  'confirmed',
  'checked_in',
  'checked_out',
  'completed'
] as const;

export type BookingStatus = (typeof bookingStatusValues)[number];

// A booking is "committed" once it reaches confirmed — the guest has secured
// the dates. Committed bookings block the exported calendar and are booked to
// the ledger; tentative ones (inquiry/offered) are not.
export const committedBookingStatuses: BookingStatus[] = [
  'confirmed',
  'checked_in',
  'checked_out',
  'completed'
];

export function isCommittedBooking(status: BookingStatus): boolean {
  return committedBookingStatuses.includes(status);
}
