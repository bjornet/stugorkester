import { db } from '$lib/server/db';
import { blocking, booking, property } from '$lib/server/db/schema';
import { committedBookingStatuses } from '$lib/booking-status';
import { error } from '@sveltejs/kit';
import { and, eq, inArray } from 'drizzle-orm';
import ical, { ICalCalendarMethod } from 'ical-generator';
import type { RequestHandler } from './$types';

/** Parse a stored `YYYY-MM-DD` as UTC midnight so the all-day date can't drift. */
function asUtcDate(date: string): Date {
  return new Date(`${date}T00:00:00Z`);
}

export const GET: RequestHandler = async ({ params }) => {
  const found = await db
    .select({ id: property.id, name: property.name })
    .from(property)
    .where(eq(property.id, params.id))
    .get();
  if (!found) throw error(404, 'Property not found');

  const [bookings, blockings] = await Promise.all([
    db
      .select({ id: booking.id, checkIn: booking.checkIn, checkOut: booking.checkOut })
      .from(booking)
      .where(
        and(eq(booking.propertyId, params.id), inArray(booking.status, committedBookingStatuses))
      ),
    db
      .select({ id: blocking.id, startDate: blocking.startDate, endDate: blocking.endDate })
      .from(blocking)
      .where(eq(blocking.propertyId, params.id))
  ]);

  const cal = ical({
    name: `${found.name} – availability`,
    prodId: { company: 'stugorkester', product: 'availability' }
  });
  cal.method(ICalCalendarMethod.PUBLISH);

  // Summaries are deliberately generic — the export carries busy intervals
  // only, never guest data (design §2, Airbnb export semantics).
  for (const b of bookings) {
    cal.createEvent({
      id: `booking-${b.id}`,
      start: asUtcDate(b.checkIn),
      end: asUtcDate(b.checkOut), // exclusive, matching iCal all-day DTEND
      allDay: true,
      summary: 'Booked'
    });
  }
  for (const b of blockings) {
    cal.createEvent({
      id: `blocking-${b.id}`,
      start: asUtcDate(b.startDate),
      end: asUtcDate(b.endDate),
      allDay: true,
      summary: 'Blocked'
    });
  }

  return new Response(cal.toString(), {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `inline; filename="${found.id}.ics"`,
      'Cache-Control': 'no-cache'
    }
  });
};
