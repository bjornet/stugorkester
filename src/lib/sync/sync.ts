import { Data, Duration, Effect, Schedule } from 'effect';
import { and, eq } from 'drizzle-orm';
import type { DrizzleDb } from '../server/db/client.ts';
import { blocking, booking, channelFeed, task } from '../server/db/schema.ts';
import { findConflicts, type DateInterval, type Occupancy } from '../availability.ts';
import { diffShadowBookings, type ExistingShadow } from './diff.ts';
import { parseIcalFeed } from './ical.ts';

export class FeedFetchError extends Data.TaggedError('FeedFetchError')<{ message: string }> {}

export interface FeedRow {
  id: string;
  propertyId: string;
  channelId: string;
  url: string;
}

export interface SyncResult {
  feedId: string;
  ok: boolean;
  inserted: number;
  updated: number;
  deleted: number;
  conflicts: number;
  error?: string;
}

const FETCH_TIMEOUT = Duration.seconds(20);
// Exponential backoff, capped at 3 retries (intersect stops when either stops).
const RETRY_POLICY = Schedule.exponential(Duration.seconds(1)).pipe(
  Schedule.intersect(Schedule.recurs(3))
);

/** Fetch a feed's body with a timeout and bounded exponential-backoff retry. */
export function fetchFeed(url: string): Effect.Effect<string, FeedFetchError> {
  return Effect.tryPromise({
    try: async () => {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.text();
    },
    catch: (e) => new FeedFetchError({ message: e instanceof Error ? e.message : String(e) })
  }).pipe(
    Effect.timeoutFail({
      duration: FETCH_TIMEOUT,
      onTimeout: () => new FeedFetchError({ message: 'fetch timed out' })
    }),
    Effect.retry(RETRY_POLICY)
  );
}

/** Existing shadow bookings created from this feed, keyed by their iCal UID. */
async function loadExistingShadows(db: DrizzleDb, feed: FeedRow): Promise<ExistingShadow[]> {
  const rows = await db
    .select({
      id: booking.id,
      externalRef: booking.externalRef,
      checkIn: booking.checkIn,
      checkOut: booking.checkOut
    })
    .from(booking)
    .where(
      and(
        eq(booking.propertyId, feed.propertyId),
        eq(booking.channelId, feed.channelId),
        eq(booking.isShadow, true)
      )
    );

  return rows
    .filter((r): r is typeof r & { externalRef: string } => r.externalRef !== null)
    .map((r) => ({ id: r.id, uid: r.externalRef, checkIn: r.checkIn, checkOut: r.checkOut }));
}

/** Non-shadow bookings and blockings on the property, as occupancies. */
async function loadFirmOccupancies(db: DrizzleDb, propertyId: string): Promise<Occupancy[]> {
  const [bookings, blockings] = await Promise.all([
    db
      .select({ id: booking.id, checkIn: booking.checkIn, checkOut: booking.checkOut })
      .from(booking)
      .where(and(eq(booking.propertyId, propertyId), eq(booking.isShadow, false))),
    db
      .select({ id: blocking.id, startDate: blocking.startDate, endDate: blocking.endDate })
      .from(blocking)
      .where(eq(blocking.propertyId, propertyId))
  ]);

  return [
    ...bookings.map((b) => ({
      id: b.id,
      kind: 'booking' as const,
      label: 'booking',
      start: b.checkIn,
      end: b.checkOut
    })),
    ...blockings.map((b) => ({
      id: b.id,
      kind: 'blocking' as const,
      label: 'blocking',
      start: b.startDate,
      end: b.endDate
    }))
  ];
}

/**
 * Conflict-task title that names the firm booking(s)/blocking(s) an imported
 * stay overlaps, so the task points at what actually clashes (design §4.2)
 * rather than only restating the imported dates.
 */
export function conflictTaskTitle(imported: DateInterval, clashes: readonly Occupancy[]): string {
  const overlaps = clashes.map((c) => `${c.label} ${c.start} → ${c.end}`).join(', ');
  return `Sync conflict: imported ${imported.start} → ${imported.end} overlaps ${overlaps}`;
}

/** Create a conflict task once per (property, title); pending ones aren't duplicated. */
async function ensureConflictTask(
  db: DrizzleDb,
  propertyId: string,
  title: string
): Promise<boolean> {
  const existing = await db
    .select({ id: task.id })
    .from(task)
    .where(and(eq(task.propertyId, propertyId), eq(task.title, title), eq(task.type, 'other')))
    .get();
  if (existing) return false;

  await db.insert(task).values({ propertyId, type: 'other', title, status: 'pending' });
  return true;
}

/**
 * Apply parsed feed events to the database for one feed: reconcile shadow
 * bookings via the pure diff, then flag any imported stay that overlaps a firm
 * (non-shadow) booking or blocking as a conflict task (design §4.2). The
 * imported bookings are shadows to be completed manually with guest data (§2).
 */
export async function persistSync(
  db: DrizzleDb,
  feed: FeedRow,
  events: { uid: string; start: string; end: string }[]
): Promise<{ inserted: number; updated: number; deleted: number; conflicts: number }> {
  const existing = await loadExistingShadows(db, feed);
  const plan = diffShadowBookings(events, existing);

  for (const event of plan.toInsert) {
    await db.insert(booking).values({
      propertyId: feed.propertyId,
      channelId: feed.channelId,
      status: 'confirmed',
      checkIn: event.start,
      checkOut: event.end,
      isShadow: true,
      externalRef: event.uid
    });
  }

  for (const { id, event } of plan.toUpdate) {
    await db
      .update(booking)
      .set({ checkIn: event.start, checkOut: event.end })
      .where(eq(booking.id, id));
  }

  for (const id of plan.toDelete) {
    // FKs aren't enforced; orphan any linked task rather than deleting it.
    await db.update(task).set({ bookingId: null }).where(eq(task.bookingId, id));
    await db.delete(booking).where(eq(booking.id, id));
  }

  // Flag overlaps between imported shadows and firm bookings/blockings.
  const firm = await loadFirmOccupancies(db, feed.propertyId);
  let conflicts = 0;
  for (const event of events) {
    const imported = { start: event.start, end: event.end };
    const clashes = findConflicts(imported, firm);
    if (clashes.length === 0) continue;
    const title = conflictTaskTitle(imported, clashes);
    if (await ensureConflictTask(db, feed.propertyId, title)) conflicts++;
  }

  return {
    inserted: plan.toInsert.length,
    updated: plan.toUpdate.length,
    deleted: plan.toDelete.length,
    conflicts
  };
}

function nowIso(): string {
  return new Date().toISOString();
}

/**
 * Sync one feed end to end. Fetch/parse failures are recorded in the feed's
 * health fields and never propagate, so one broken feed can't stop the worker.
 */
export function syncFeed(db: DrizzleDb, feed: FeedRow): Effect.Effect<SyncResult> {
  return fetchFeed(feed.url).pipe(
    Effect.flatMap((body) =>
      Effect.promise(async () => {
        const events = parseIcalFeed(body);
        const counts = await persistSync(db, feed, events);
        await db
          .update(channelFeed)
          .set({ lastPolledAt: nowIso(), lastSuccessAt: nowIso(), lastError: null })
          .where(eq(channelFeed.id, feed.id));
        return { feedId: feed.id, ok: true, ...counts } satisfies SyncResult;
      })
    ),
    Effect.catchAll((err) =>
      Effect.promise(async () => {
        await db
          .update(channelFeed)
          .set({ lastPolledAt: nowIso(), lastError: err.message })
          .where(eq(channelFeed.id, feed.id));
        return {
          feedId: feed.id,
          ok: false,
          inserted: 0,
          updated: 0,
          deleted: 0,
          conflicts: 0,
          error: err.message
        } satisfies SyncResult;
      })
    )
  );
}

/** Sync every active feed once, sequentially (single-writer SQLite). */
export function syncAllFeeds(db: DrizzleDb): Effect.Effect<SyncResult[]> {
  return Effect.promise(() =>
    db
      .select({
        id: channelFeed.id,
        propertyId: channelFeed.propertyId,
        channelId: channelFeed.channelId,
        url: channelFeed.url
      })
      .from(channelFeed)
      .where(eq(channelFeed.active, true))
  ).pipe(Effect.flatMap((feeds) => Effect.forEach(feeds, (feed) => syncFeed(db, feed))));
}
