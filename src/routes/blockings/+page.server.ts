import { db } from '$lib/server/db';
import { parseBlocking } from '$lib/server/blocking-form';
import { detectConflicts } from '$lib/server/availability';
import { blocking, property } from '$lib/server/db/schema';
import { fail } from '@sveltejs/kit';
import { asc, desc } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  const [blockings, properties] = await Promise.all([
    db.query.blocking.findMany({
      with: { property: { columns: { name: true } } },
      orderBy: (b) => [desc(b.startDate)]
    }),
    db.select({ id: property.id, name: property.name }).from(property).orderBy(asc(property.name))
  ]);

  return { blockings, properties };
};

export const actions: Actions = {
  create: async ({ request }) => {
    const data = await request.formData();
    const parsed = parseBlocking(data);
    if (!parsed.ok) {
      return fail(400, { error: parsed.error, values: parsed.values });
    }

    if (data.get('force') !== 'true') {
      const conflicts = await detectConflicts(parsed.value.propertyId, {
        start: parsed.value.startDate,
        end: parsed.value.endDate
      });
      if (conflicts.length > 0) {
        return fail(409, { conflicts, values: parsed.value });
      }
    }

    await db.insert(blocking).values(parsed.value);
    return { created: true };
  }
};
