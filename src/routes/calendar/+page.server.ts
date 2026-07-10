import { db } from '$lib/server/db';
import { property } from '$lib/server/db/schema';
import { asc } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export interface CalendarEvent {
  id: string;
  title: string;
  /** Inclusive first day (`YYYY-MM-DD`). */
  start: string;
  /** Exclusive last day — matches FullCalendar's all-day `end` and our
   *  half-open interval semantics (check-out day is free again). */
  end: string;
  propertyId: string;
  kind: 'booking' | 'blocking';
  color: string;
}

// Firm bookings are green; tentative ones (inquiry/offered) amber so an
// unconfirmed hold reads differently from a committed stay; blockings grey.
const CONFIRMED = '#2f6f4f';
const TENTATIVE = '#c9932f';
const BLOCKED = '#8a8a8a';
const TENTATIVE_STATUSES = new Set(['inquiry', 'offered']);

export const load: PageServerLoad = async () => {
  const [bookings, blockings, properties] = await Promise.all([
    db.query.booking.findMany({
      columns: { id: true, propertyId: true, checkIn: true, checkOut: true, status: true },
      with: { property: { columns: { name: true } }, guest: { columns: { name: true } } }
    }),
    db.query.blocking.findMany({
      columns: { id: true, propertyId: true, startDate: true, endDate: true, reason: true },
      with: { property: { columns: { name: true } } }
    }),
    db.select({ id: property.id, name: property.name }).from(property).orderBy(asc(property.name))
  ]);

  const events: CalendarEvent[] = [
    ...bookings.map((b) => ({
      id: `booking-${b.id}`,
      title: `${b.property.name}: ${b.guest?.name ?? b.status}`,
      start: b.checkIn,
      end: b.checkOut,
      propertyId: b.propertyId,
      kind: 'booking' as const,
      color: TENTATIVE_STATUSES.has(b.status) ? TENTATIVE : CONFIRMED
    })),
    ...blockings.map((b) => ({
      id: `blocking-${b.id}`,
      title: `${b.property.name}: ${b.reason ?? 'Blocked'}`,
      start: b.startDate,
      end: b.endDate,
      propertyId: b.propertyId,
      kind: 'blocking' as const,
      color: BLOCKED
    }))
  ];

  return { events, properties };
};
