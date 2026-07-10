import { db } from '$lib/server/db';
import { booking, guest } from '$lib/server/db/schema';
import { isEmail, text } from '$lib/server/forms';
import { error, fail, redirect } from '@sveltejs/kit';
import { eq, sql } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
  const found = await db.select().from(guest).where(eq(guest.id, params.id)).get();
  if (!found) throw error(404, 'Guest not found');

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(booking)
    .where(eq(booking.guestId, params.id));

  return { guest: found, bookingCount: count };
};

export const actions: Actions = {
  update: async ({ params, request }) => {
    const data = await request.formData();
    const name = text(data, 'name');
    const email = text(data, 'email');
    const phone = text(data, 'phone');
    const notes = text(data, 'notes');

    if (!name) {
      return fail(400, { error: 'Name is required.' });
    }
    if (email && !isEmail(email)) {
      return fail(400, { error: 'Email looks invalid.' });
    }

    await db
      .update(guest)
      .set({ name, email, phone, notes, updatedAt: sql`(current_timestamp)` })
      .where(eq(guest.id, params.id));

    throw redirect(303, '/guests');
  },

  delete: async ({ params }) => {
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(booking)
      .where(eq(booking.guestId, params.id));

    if (count > 0) {
      return fail(400, {
        error: `Cannot delete: ${count} booking(s) reference this guest.`
      });
    }

    await db.delete(guest).where(eq(guest.id, params.id));
    throw redirect(303, '/guests');
  }
};
