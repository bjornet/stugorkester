import { db } from '$lib/server/db';
import { property } from '$lib/server/db/schema';
import { text } from '$lib/server/forms';
import { fail } from '@sveltejs/kit';
import { asc } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  const properties = await db.select().from(property).orderBy(asc(property.name));
  return { properties };
};

export const actions: Actions = {
  create: async ({ request }) => {
    const data = await request.formData();
    const name = text(data, 'name');
    const description = text(data, 'description');
    const houseRules = text(data, 'houseRules');

    if (!name) {
      return fail(400, {
        error: 'Name is required.',
        values: { name: '', description, houseRules }
      });
    }

    await db.insert(property).values({ name, description, houseRules });
    return { created: true };
  }
};
