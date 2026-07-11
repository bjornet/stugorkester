import { db } from '$lib/server/db';
import { blocking, booking, guest, property, task } from '$lib/server/db/schema';
import { ne, sql } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  const [properties, bookings, blockings, openTasks, guests] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(property),
    db.select({ count: sql<number>`count(*)` }).from(booking),
    db.select({ count: sql<number>`count(*)` }).from(blocking),
    // Open tasks = anything not yet done; that's the number worth surfacing.
    db
      .select({ count: sql<number>`count(*)` })
      .from(task)
      .where(ne(task.status, 'done')),
    db.select({ count: sql<number>`count(*)` }).from(guest)
  ]);

  return {
    counts: {
      properties: properties[0].count,
      bookings: bookings[0].count,
      blockings: blockings[0].count,
      openTasks: openTasks[0].count,
      guests: guests[0].count
    }
  };
};
