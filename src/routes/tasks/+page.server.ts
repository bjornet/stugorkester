import { db } from '$lib/server/db';
import { parseTask } from '$lib/server/task-form';
import { bookingOptionLabel } from '$lib/server/booking-options';
import { property, task } from '$lib/server/db/schema';
import { taskStatusValues } from '$lib/task-enums';
import { isOneOf } from '$lib/server/forms';
import { fail } from '@sveltejs/kit';
import { asc, desc, eq } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
  const statusFilter = url.searchParams.get('status');
  const activeStatus = isOneOf(statusFilter, taskStatusValues) ? statusFilter : null;

  const [tasks, properties, bookings] = await Promise.all([
    db.query.task.findMany({
      where: activeStatus ? eq(task.status, activeStatus) : undefined,
      with: {
        property: { columns: { name: true } },
        booking: { columns: { checkIn: true, checkOut: true } }
      },
      // Undated tasks sort after dated ones; then soonest deadline first.
      orderBy: (t) => [asc(t.dueDate), desc(t.createdAt)]
    }),
    db.select({ id: property.id, name: property.name }).from(property).orderBy(asc(property.name)),
    db.query.booking.findMany({
      columns: { id: true, checkIn: true, checkOut: true },
      with: { property: { columns: { name: true } } },
      orderBy: (b) => [desc(b.checkIn)]
    })
  ]);

  return {
    tasks,
    properties,
    bookings: bookings.map((b) => ({ id: b.id, name: bookingOptionLabel(b) })),
    activeStatus
  };
};

export const actions: Actions = {
  create: async ({ request }) => {
    const parsed = parseTask(await request.formData());
    if (!parsed.ok) {
      return fail(400, { error: parsed.error, values: parsed.values });
    }

    await db.insert(task).values(parsed.value);
    return { created: true };
  }
};
