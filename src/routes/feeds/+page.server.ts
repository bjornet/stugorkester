import { db } from '$lib/server/db';
import { parseFeed } from '$lib/server/feed-form';
import { channel, channelFeed, property } from '$lib/server/db/schema';
import { feedHealth } from '$lib/feed-health';
import { fail } from '@sveltejs/kit';
import { asc, desc } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  const now = Date.now();
  const [feeds, properties, channels] = await Promise.all([
    db.query.channelFeed.findMany({
      with: {
        property: { columns: { name: true } },
        channel: { columns: { name: true } }
      },
      orderBy: (f) => [desc(f.createdAt)]
    }),
    db.select({ id: property.id, name: property.name }).from(property).orderBy(asc(property.name)),
    db.select({ id: channel.id, name: channel.name }).from(channel).orderBy(asc(channel.name))
  ]);

  return {
    feeds: feeds.map((f) => ({
      id: f.id,
      url: f.url,
      active: f.active,
      propertyName: f.property.name,
      channelName: f.channel.name,
      lastSuccessAt: f.lastSuccessAt,
      lastError: f.lastError,
      health: feedHealth(f, now)
    })),
    properties,
    channels
  };
};

export const actions: Actions = {
  create: async ({ request }) => {
    const parsed = parseFeed(await request.formData());
    if (!parsed.ok) {
      return fail(400, { error: parsed.error, values: parsed.values });
    }

    await db.insert(channelFeed).values(parsed.value);
    return { created: true };
  }
};
