import { db } from '$lib/server/db';
import { parseBooking } from '$lib/server/booking-form';
import { detectConflicts } from '$lib/server/availability';
import { syncCleaningTaskForBooking } from '$lib/server/cleaning';
import { syncLedgerForBooking } from '$lib/server/ledger';
import { booking, channel, guest, ledgerEntry, property } from '$lib/server/db/schema';
import { error, fail, redirect } from '@sveltejs/kit';
import { asc, eq, sql } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
  const [found, properties, channels, guests] = await Promise.all([
    db.select().from(booking).where(eq(booking.id, params.id)).get(),
    db.select({ id: property.id, name: property.name }).from(property).orderBy(asc(property.name)),
    db.select({ id: channel.id, name: channel.name }).from(channel).orderBy(asc(channel.name)),
    db.select({ id: guest.id, name: guest.name }).from(guest).orderBy(asc(guest.name))
  ]);

  if (!found) throw error(404, 'Booking not found');

  // Surface any existing conflict up front (design §4.2) so the warning is
  // visible before the user tries to save, not only after a rejected submit.
  const conflicts = await detectConflicts(
    found.propertyId,
    { start: found.checkIn, end: found.checkOut },
    found.id
  );

  return { booking: found, conflicts, properties, channels, guests };
};

export const actions: Actions = {
  update: async ({ params, request }) => {
    const data = await request.formData();
    const parsed = parseBooking(data);
    if (!parsed.ok) {
      return fail(400, { error: parsed.error, values: parsed.values });
    }

    if (data.get('force') !== 'true') {
      const conflicts = await detectConflicts(
        parsed.value.propertyId,
        { start: parsed.value.checkIn, end: parsed.value.checkOut },
        params.id
      );
      if (conflicts.length > 0) {
        return fail(409, { conflicts, values: parsed.value });
      }
    }

    await db
      .update(booking)
      .set({ ...parsed.value, updatedAt: sql`(current_timestamp)` })
      .where(eq(booking.id, params.id));

    await syncCleaningTaskForBooking(params.id);
    await syncLedgerForBooking(params.id);

    throw redirect(303, '/bookings');
  },

  delete: async ({ params }) => {
    // Remove booking-derived ledger entries so economy totals stay accurate.
    await db.delete(ledgerEntry).where(eq(ledgerEntry.bookingId, params.id));
    await db.delete(booking).where(eq(booking.id, params.id));
    throw redirect(303, '/bookings');
  }
};
