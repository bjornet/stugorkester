import { db } from '$lib/server/db';
import { blocking, booking, guest, property } from '$lib/server/db/schema';
import { sql } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
  const [properties, bookings, blockings, guests] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(property),
    db.select({ count: sql<number>`count(*)` }).from(booking),
    db.select({ count: sql<number>`count(*)` }).from(blocking),
    db.select({ count: sql<number>`count(*)` }).from(guest)
  ]);

  return {
    counts: {
      properties: properties[0].count,
      bookings: bookings[0].count,
      blockings: blockings[0].count,
      guests: guests[0].count
    }
  };
};
