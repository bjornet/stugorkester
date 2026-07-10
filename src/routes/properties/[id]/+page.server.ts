import { db } from '$lib/server/db';
import { booking, property } from '$lib/server/db/schema';
import { text } from '$lib/server/forms';
import { error, fail, redirect } from '@sveltejs/kit';
import { eq, sql } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
  const found = await db.select().from(property).where(eq(property.id, params.id)).get();
  if (!found) throw error(404, 'Property not found');

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)` })
    .from(booking)
    .where(eq(booking.propertyId, params.id));

  return { property: found, bookingCount: count };
};

export const actions: Actions = {
  update: async ({ params, request }) => {
    const data = await request.formData();
    const name = text(data, 'name');
    const description = text(data, 'description');
    const houseRules = text(data, 'houseRules');

    if (!name) {
      return fail(400, { error: 'Name is required.' });
    }

    await db
      .update(property)
      .set({ name, description, houseRules, updatedAt: sql`(current_timestamp)` })
      .where(eq(property.id, params.id));

    throw redirect(303, '/properties');
  },

  delete: async ({ params }) => {
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(booking)
      .where(eq(booking.propertyId, params.id));

    if (count > 0) {
      return fail(400, {
        error: `Cannot delete: ${count} booking(s) reference this property.`
      });
    }

    await db.delete(property).where(eq(property.id, params.id));
    throw redirect(303, '/properties');
  }
};
