// Pure diff between an imported iCal feed and the shadow bookings we already
// hold for that feed. Client-safe and side-effect free so it is fully
// unit-testable; the worker applies the resulting plan to the database.

/** A busy interval parsed from a feed, keyed by its iCal UID. Dates are
 *  half-open `YYYY-MM-DD` (end exclusive), matching our booking semantics. */
export interface FeedEvent {
  uid: string;
  start: string;
  end: string;
}

/** An existing shadow booking created from a previous import of this feed. */
export interface ExistingShadow {
  id: string;
  uid: string;
  checkIn: string;
  checkOut: string;
}

export interface FeedDiff {
  toInsert: FeedEvent[];
  toUpdate: { id: string; event: FeedEvent }[];
  toDelete: string[];
}

/**
 * Reconcile feed events against existing shadow bookings, matched by UID:
 * - UID only in the feed        → insert a new shadow booking.
 * - UID in both, dates changed  → update the existing shadow booking.
 * - UID only in existing        → the stay was removed on the channel → delete.
 *
 * Existing rows are assumed to belong to this one feed (same property+channel);
 * the caller scopes the query. Duplicate feed UIDs keep the first occurrence.
 */
export function diffShadowBookings(
  events: readonly FeedEvent[],
  existing: readonly ExistingShadow[]
): FeedDiff {
  const existingByUid = new Map(existing.map((e) => [e.uid, e]));
  const seen = new Set<string>();

  const toInsert: FeedEvent[] = [];
  const toUpdate: { id: string; event: FeedEvent }[] = [];

  for (const event of events) {
    if (seen.has(event.uid)) continue;
    seen.add(event.uid);

    const match = existingByUid.get(event.uid);
    if (!match) {
      toInsert.push(event);
    } else if (match.checkIn !== event.start || match.checkOut !== event.end) {
      toUpdate.push({ id: match.id, event });
    }
  }

  const toDelete = existing.filter((e) => !seen.has(e.uid)).map((e) => e.id);

  return { toInsert, toUpdate, toDelete };
}
