import { db } from './db';
import { booking, ledgerEntry } from './db/schema';
import { isCommittedBooking } from '$lib/booking-status';
import { bookingIncome, computeLedger } from '$lib/economy';
import { eq } from 'drizzle-orm';

/**
 * Keep a booking's ledger entries in step with the booking (design §4.7 step 4:
 * confirmation books an economy entry). A committed booking with income posts
 * three entries — income, commission, net — dated on its checkout; a tentative
 * or unpriced booking posts none.
 *
 * Recompute from scratch (delete then re-post) so a price, commission, or
 * status change can't leave stale amounts. Ledger entries are booking-derived,
 * so clearing by bookingId is safe. Idempotent: call after every save.
 */
export async function syncLedgerForBooking(bookingId: string): Promise<void> {
  const found = await db.query.booking.findFirst({
    where: eq(booking.id, bookingId),
    columns: {
      id: true,
      propertyId: true,
      channelId: true,
      status: true,
      totalPrice: true,
      basePrice: true,
      cleaningFee: true,
      checkOut: true
    },
    with: { channel: { columns: { commissionRate: true } } }
  });
  if (!found) return;

  await db.delete(ledgerEntry).where(eq(ledgerEntry.bookingId, bookingId));

  if (!isCommittedBooking(found.status)) return;

  const income = bookingIncome(found);
  if (income <= 0) return;

  const split = computeLedger(income, found.channel.commissionRate);
  const common = {
    propertyId: found.propertyId,
    channelId: found.channelId,
    bookingId: found.id,
    occurredAt: found.checkOut
  };

  await db.insert(ledgerEntry).values([
    { ...common, type: 'income', amount: split.income },
    { ...common, type: 'commission', amount: split.commission },
    { ...common, type: 'net', amount: split.net }
  ]);
}
