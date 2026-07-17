import { db } from './db';
import { blocking, booking } from './db/schema';
import {
  conflictingBookingIds,
  findConflicts,
  type DateInterval,
  type Occupancy,
  type PropertyOccupancy
} from '$lib/availability';
import { bookingStatusLabel } from '$lib/format';
import { eq } from 'drizzle-orm';

/**
 * Load every occupancy (bookings + blockings) for one property in the calendar
 * engine's shape, so conflict detection and the calendar view share one query.
 */
export async function loadOccupancies(propertyId: string): Promise<Occupancy[]> {
  const [bookings, blockings] = await Promise.all([
    db.query.booking.findMany({
      where: eq(booking.propertyId, propertyId),
      columns: { id: true, checkIn: true, checkOut: true, status: true },
      with: { guest: { columns: { name: true } }, channel: { columns: { name: true } } }
    }),
    db
      .select({
        id: blocking.id,
        startDate: blocking.startDate,
        endDate: blocking.endDate,
        reason: blocking.reason
      })
      .from(blocking)
      .where(eq(blocking.propertyId, propertyId))
  ]);

  const bookingOccupancies: Occupancy[] = bookings.map((b) => ({
    id: b.id,
    kind: 'booking',
    label: b.guest?.name ?? b.channel.name,
    start: b.checkIn,
    end: b.checkOut,
    status: b.status
  }));

  const blockingOccupancies: Occupancy[] = blockings.map((b) => ({
    id: b.id,
    kind: 'blocking',
    label: b.reason ?? 'Blocking',
    start: b.startDate,
    end: b.endDate,
    status: null
  }));

  return [...bookingOccupancies, ...blockingOccupancies];
}

/**
 * Ids of bookings that overlap another booking or blocking on the same
 * property, across all properties — used to flag clashing rows in the bookings
 * list (design §4.2).
 */
export async function loadConflictingBookingIds(): Promise<string[]> {
  const [bookings, blockings] = await Promise.all([
    db.query.booking.findMany({
      columns: { id: true, propertyId: true, checkIn: true, checkOut: true, status: true }
    }),
    db
      .select({
        id: blocking.id,
        propertyId: blocking.propertyId,
        startDate: blocking.startDate,
        endDate: blocking.endDate
      })
      .from(blocking)
  ]);

  const occupancies: PropertyOccupancy[] = [
    ...bookings.map((b) => ({
      id: b.id,
      propertyId: b.propertyId,
      kind: 'booking' as const,
      label: '',
      start: b.checkIn,
      end: b.checkOut,
      status: b.status
    })),
    ...blockings.map((b) => ({
      id: b.id,
      propertyId: b.propertyId,
      kind: 'blocking' as const,
      label: '',
      start: b.startDate,
      end: b.endDate,
      status: null
    }))
  ];

  return [...conflictingBookingIds(occupancies)];
}

/** One-line, human-readable description of a conflicting occupancy. */
export function describeConflict(o: Occupancy): string {
  const range = `${o.start} → ${o.end}`;
  if (o.kind === 'booking') {
    return `Booking ${range} — ${o.label} (${bookingStatusLabel(o.status ?? '')})`;
  }
  return `Blocking ${range} — ${o.label}`;
}

/**
 * Detect overlaps for a candidate range on a property, excluding the row being
 * edited. Returns descriptions for display; empty when the range is free.
 */
export async function detectConflicts(
  propertyId: string,
  candidate: DateInterval,
  selfId?: string
): Promise<string[]> {
  const occupancies = await loadOccupancies(propertyId);
  return findConflicts(candidate, occupancies, selfId).map(describeConflict);
}
