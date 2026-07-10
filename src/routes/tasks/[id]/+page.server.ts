import { db } from '$lib/server/db';
import { parseTask } from '$lib/server/task-form';
import { bookingOptionLabel } from '$lib/server/booking-options';
import { property, task } from '$lib/server/db/schema';
import { error, fail, redirect } from '@sveltejs/kit';
import { asc, desc, eq, sql } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
  const [found, properties, bookings] = await Promise.all([
    db.select().from(task).where(eq(task.id, params.id)).get(),
    db.select({ id: property.id, name: property.name }).from(property).orderBy(asc(property.name)),
    db.query.booking.findMany({
      columns: { id: true, checkIn: true, checkOut: true },
      with: { property: { columns: { name: true } } },
      orderBy: (b) => [desc(b.checkIn)]
    })
  ]);

  if (!found) throw error(404, 'Task not found');

  return {
    task: found,
    properties,
    bookings: bookings.map((b) => ({ id: b.id, name: bookingOptionLabel(b) }))
  };
};

export const actions: Actions = {
  update: async ({ params, request }) => {
    const parsed = parseTask(await request.formData());
    if (!parsed.ok) {
      return fail(400, { error: parsed.error, values: parsed.values });
    }

    await db
      .update(task)
      .set({ ...parsed.value, updatedAt: sql`(current_timestamp)` })
      .where(eq(task.id, params.id));

    throw redirect(303, '/tasks');
  },

  delete: async ({ params }) => {
    await db.delete(task).where(eq(task.id, params.id));
    throw redirect(303, '/tasks');
  }
};
