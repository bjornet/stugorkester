import { db } from '$lib/server/db';
import { guest } from '$lib/server/db/schema';
import { isEmail, text } from '$lib/server/forms';
import { fail } from '@sveltejs/kit';
import { asc } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  const guests = await db.select().from(guest).orderBy(asc(guest.name));
  return { guests };
};

export const actions: Actions = {
  create: async ({ request }) => {
    const data = await request.formData();
    const name = text(data, 'name');
    const email = text(data, 'email');
    const phone = text(data, 'phone');
    const notes = text(data, 'notes');

    const values = { name, email, phone, notes };

    if (!name) {
      return fail(400, { error: 'Name is required.', values });
    }
    if (email && !isEmail(email)) {
      return fail(400, { error: 'Email looks invalid.', values });
    }

    await db.insert(guest).values({ name, email, phone, notes });
    return { created: true };
  }
};
