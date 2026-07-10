import { db } from '$lib/server/db';
import { parseBooking } from '$lib/server/booking-form';
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
    const parsed = parseBooking(await request.formData());
    if (!parsed.ok) {
      return fail(400, { error: parsed.error, values: parsed.values });
    }

    await db.insert(booking).values(parsed.value);
    return { created: true };
  }
};
