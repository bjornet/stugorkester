import { db } from '$lib/server/db';
import { parseBooking } from '$lib/server/booking-form';
import { detectConflicts } from '$lib/server/availability';
import { syncCleaningTaskForBooking } from '$lib/server/cleaning';
import { booking, channel, guest, property } from '$lib/server/db/schema';
import { fail } from '@sveltejs/kit';
import { asc, desc } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  const [bookings, properties, channels, guests] = await Promise.all([
    db.query.booking.findMany({
      with: {
        property: { columns: { name: true } },
        channel: { columns: { name: true } },
        guest: { columns: { name: true } }
      },
      orderBy: (b) => [desc(b.checkIn)]
    }),
    db.select({ id: property.id, name: property.name }).from(property).orderBy(asc(property.name)),
    db.select({ id: channel.id, name: channel.name }).from(channel).orderBy(asc(channel.name)),
    db.select({ id: guest.id, name: guest.name }).from(guest).orderBy(asc(guest.name))
  ]);

  return { bookings, properties, channels, guests };
};

export const actions: Actions = {
  create: async ({ request }) => {
    const data = await request.formData();
    const parsed = parseBooking(data);
    if (!parsed.ok) {
      return fail(400, { error: parsed.error, values: parsed.values });
    }

    // Conflict detection alerts but does not block (design §4.2): the system
    // is the source of truth, so the user can override with "Save anyway".
    if (data.get('force') !== 'true') {
      const conflicts = await detectConflicts(parsed.value.propertyId, {
        start: parsed.value.checkIn,
        end: parsed.value.checkOut
      });
      if (conflicts.length > 0) {
        return fail(409, { conflicts, values: parsed.value });
      }
    }

    const [created] = await db.insert(booking).values(parsed.value).returning({ id: booking.id });
    await syncCleaningTaskForBooking(created.id);
    return { created: true };
  }
};
