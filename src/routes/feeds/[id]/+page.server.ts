import { db } from '$lib/server/db';
import { parseFeed } from '$lib/server/feed-form';
import { channel, channelFeed, property } from '$lib/server/db/schema';
import { error, fail, redirect } from '@sveltejs/kit';
import { asc, eq, sql } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
  const [found, properties, channels] = await Promise.all([
    db.select().from(channelFeed).where(eq(channelFeed.id, params.id)).get(),
    db.select({ id: property.id, name: property.name }).from(property).orderBy(asc(property.name)),
    db.select({ id: channel.id, name: channel.name }).from(channel).orderBy(asc(channel.name))
  ]);

  if (!found) throw error(404, 'Feed not found');

  return { feed: found, properties, channels };
};

export const actions: Actions = {
  update: async ({ params, request }) => {
    const parsed = parseFeed(await request.formData());
    if (!parsed.ok) {
      return fail(400, { error: parsed.error, values: parsed.values });
    }

    await db
      .update(channelFeed)
      .set({ ...parsed.value, updatedAt: sql`(current_timestamp)` })
      .where(eq(channelFeed.id, params.id));

    throw redirect(303, '/feeds');
  },

  delete: async ({ params }) => {
    await db.delete(channelFeed).where(eq(channelFeed.id, params.id));
    throw redirect(303, '/feeds');
  }
};
