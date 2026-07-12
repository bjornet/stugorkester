// Feed-health classification (design §4.2): a broken iCal URL is the most
// common silent failure, so surface how long since a feed last succeeded.
// Pure and client-safe so the UI and any alerting share one definition.

export type FeedHealth = 'paused' | 'pending' | 'error' | 'stale' | 'ok';

export interface FeedHealthInput {
  active: boolean;
  lastPolledAt: string | null;
  lastSuccessAt: string | null;
  lastError: string | null;
}

/** Hours after which a feed with no successful poll is considered stale. */
export const DEFAULT_STALE_HOURS = 6;

function hoursBetween(fromIso: string, toMs: number): number {
  return (toMs - new Date(fromIso).getTime()) / 3_600_000;
}

/**
 * Classify a feed's health at time `nowMs`:
 * - `paused`  — not active.
 * - `pending` — active but never fetched successfully yet.
 * - `error`   — the most recent poll attempt failed (later than last success).
 * - `stale`   — last success is older than `staleHours`.
 * - `ok`      — fetched successfully within the window.
 */
export function feedHealth(
  feed: FeedHealthInput,
  nowMs: number,
  staleHours: number = DEFAULT_STALE_HOURS
): FeedHealth {
  if (!feed.active) return 'paused';
  // The latest poll failed if there's an error and no later success — this
  // takes precedence over "pending" so a feed that has only ever errored still
  // reads as error, not merely not-yet-fetched.
  const erroredOnLatestPoll =
    feed.lastError != null &&
    (!feed.lastSuccessAt || (feed.lastPolledAt != null && feed.lastPolledAt > feed.lastSuccessAt));
  if (erroredOnLatestPoll) return 'error';
  if (!feed.lastSuccessAt) return 'pending';
  if (hoursBetween(feed.lastSuccessAt, nowMs) > staleHours) return 'stale';
  return 'ok';
}
