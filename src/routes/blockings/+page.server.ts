import { db } from '$lib/server/db';
import { parseBlocking } from '$lib/server/blocking-form';
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
    const parsed = parseBlocking(await request.formData());
    if (!parsed.ok) {
      return fail(400, { error: parsed.error, values: parsed.values });
    }

    await db.insert(blocking).values(parsed.value);
    return { created: true };
  }
};
