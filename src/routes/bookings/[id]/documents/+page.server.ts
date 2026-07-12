import { db } from '$lib/server/db';
import { booking } from '$lib/server/db/schema';
import { documentsForChannel, documentTitles } from '$lib/documents';
import { error } from '@sveltejs/kit';
import { eq } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
  const found = await db.query.booking.findFirst({
    where: eq(booking.id, params.id),
    columns: { id: true, checkIn: true, checkOut: true },
    with: {
      property: { columns: { name: true } },
      channel: { columns: { name: true, contractCoverage: true, supportsPayment: true } }
    }
  });
  if (!found) throw error(404, 'Booking not found');

  const documents = documentsForChannel(found.channel).map((type) => ({
    type,
    title: documentTitles[type]
  }));

  return {
    bookingId: found.id,
    propertyName: found.property.name,
    channelName: found.channel.name,
    checkIn: found.checkIn,
    checkOut: found.checkOut,
    documents
  };
};
