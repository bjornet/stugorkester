import { db } from '$lib/server/db';
import { parseBlocking } from '$lib/server/blocking-form';
import { detectConflicts } from '$lib/server/availability';
import { blocking, property } from '$lib/server/db/schema';
import { error, fail, redirect } from '@sveltejs/kit';
import { asc, eq, sql } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
  const [found, properties] = await Promise.all([
    db.select().from(blocking).where(eq(blocking.id, params.id)).get(),
    db.select({ id: property.id, name: property.name }).from(property).orderBy(asc(property.name))
  ]);

  if (!found) throw error(404, 'Blocking not found');

  return { blocking: found, properties };
};

export const actions: Actions = {
  update: async ({ params, request }) => {
    const data = await request.formData();
    const parsed = parseBlocking(data);
    if (!parsed.ok) {
      return fail(400, { error: parsed.error, values: parsed.values });
    }

    if (data.get('force') !== 'true') {
      const conflicts = await detectConflicts(
        parsed.value.propertyId,
        { start: parsed.value.startDate, end: parsed.value.endDate },
        params.id
      );
      if (conflicts.length > 0) {
        return fail(409, { conflicts, values: parsed.value });
      }
    }

    await db
      .update(blocking)
      .set({ ...parsed.value, updatedAt: sql`(current_timestamp)` })
      .where(eq(blocking.id, params.id));

    throw redirect(303, '/blockings');
  },

  delete: async ({ params }) => {
    await db.delete(blocking).where(eq(blocking.id, params.id));
    throw redirect(303, '/blockings');
  }
};
