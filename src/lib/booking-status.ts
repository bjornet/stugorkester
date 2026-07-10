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
