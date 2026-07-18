import { db } from '$lib/server/db';
import { parseBooking } from '$lib/server/booking-form';
import { detectConflicts, loadConflictingBookingIds } from '$lib/server/availability';
import { syncCleaningTaskForBooking } from '$lib/server/cleaning';
import { syncLedgerForBooking } from '$lib/server/ledger';
import { booking, channel, guest, property, task } from '$lib/server/db/schema';
import { fail } from '@sveltejs/kit';
import { asc, desc, eq, isNotNull } from 'drizzle-orm';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
  const [bookings, conflictIds, bookingTasks, properties, channels, guests] = await Promise.all([
    db.query.booking.findMany({
      with: {
        property: { columns: { name: true } },
        channel: { columns: { name: true } },
        guest: { columns: { name: true } }
      },
      orderBy: (b) => [desc(b.checkIn)]
    }),
    loadConflictingBookingIds(),
    db
      .select({ id: task.id, bookingId: task.bookingId, title: task.title })
      .from(task)
      .where(isNotNull(task.bookingId)),
    db.select({ id: property.id, name: property.name }).from(property).orderBy(asc(property.name)),
    db.select({ id: channel.id, name: channel.name }).from(channel).orderBy(asc(channel.name)),
    db.select({ id: guest.id, name: guest.name }).from(guest).orderBy(asc(guest.name))
  ]);

  // Tasks linked to each booking (e.g. its cleaning task), for the list's
  // Tasks column.
  const tasksByBooking: Record<string, { id: string; title: string }[]> = {};
  for (const t of bookingTasks) {
    if (!t.bookingId) continue;
    (tasksByBooking[t.bookingId] ??= []).push({ id: t.id, title: t.title });
  }

  // `?template=<id>` pre-fills the create form from an existing booking, minus
  // the dates and guest (a template is reused for a new, different stay).
  const templateId = url.searchParams.get('template');
  const template = templateId
    ? ((await db
        .select({
          propertyId: booking.propertyId,
          channelId: booking.channelId,
          basePrice: booking.basePrice,
          cleaningFee: booking.cleaningFee,
          totalPrice: booking.totalPrice,
          cancellationPolicy: booking.cancellationPolicy
        })
        .from(booking)
        .where(eq(booking.id, templateId))
        .get()) ?? null)
    : null;

  return { bookings, conflictIds, tasksByBooking, template, properties, channels, guests };
};

export const actions: Actions = {
  create: async ({ request }) => {
    const data = await request.formData();
    const parsed = parseBooking(data);
    if (!parsed.ok) {
      return fail(400, { error: parsed.error, values: parsed.values });
    }

    // Conflict detection alerts but does not block (design §4.2): the system
    // is the source of truth, so the user can override with "Save anyway".
    if (data.get('force') !== 'true') {
      const conflicts = await detectConflicts(parsed.value.propertyId, {
        start: parsed.value.checkIn,
        end: parsed.value.checkOut
      });
      if (conflicts.length > 0) {
        return fail(409, { conflicts, values: parsed.value });
      }
    }

    const [created] = await db.insert(booking).values(parsed.value).returning({ id: booking.id });
    await syncCleaningTaskForBooking(created.id);
    await syncLedgerForBooking(created.id);
    return { created: true };
  }
};
