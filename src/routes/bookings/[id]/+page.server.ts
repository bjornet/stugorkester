import { db } from '$lib/server/db';
import { parseBooking } from '$lib/server/booking-form';
import { booking, channel, guest, property } from '$lib/server/db/schema';
import { error, fail, redirect } from '@sveltejs/kit';
import { asc, eq, sql } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
  const [found, properties, channels, guests] = await Promise.all([
    db.select().from(booking).where(eq(booking.id, params.id)).get(),
    db.select({ id: property.id, name: property.name }).from(property).orderBy(asc(property.name)),
    db.select({ id: channel.id, name: channel.name }).from(channel).orderBy(asc(channel.name)),
    db.select({ id: guest.id, name: guest.name }).from(guest).orderBy(asc(guest.name))
  ]);

  if (!found) throw error(404, 'Booking not found');

  return { booking: found, properties, channels, guests };
};

export const actions: Actions = {
  update: async ({ params, request }) => {
    const parsed = parseBooking(await request.formData());
    if (!parsed.ok) {
      return fail(400, { error: parsed.error, values: parsed.values });
    }

    await db
      .update(booking)
      .set({ ...parsed.value, updatedAt: sql`(current_timestamp)` })
      .where(eq(booking.id, params.id));

    throw redirect(303, '/bookings');
  },

  delete: async ({ params }) => {
    await db.delete(booking).where(eq(booking.id, params.id));
    throw redirect(303, '/bookings');
  }
};
