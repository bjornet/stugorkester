import { eq } from 'drizzle-orm';
import type { DrizzleDb } from '../server/db/client.ts';
import { channelFeed } from '../server/db/schema.ts';
import { feedHealth } from '../feed-health.ts';
import { feedAlertMessage, type FeedHealthLine } from '../notify/messages.ts';
import { sendAlert } from '../notify/email.ts';

// Don't re-alert about the same feed more than once a day, so a persistently
// broken feed doesn't email on every poll.
const ALERT_COOLDOWN_HOURS = 24;

function hoursSince(iso: string, nowMs: number): number {
  return (nowMs - new Date(iso).getTime()) / 3_600_000;
}

/**
 * Email a digest of feeds that need attention (stale or erroring), throttled
 * per feed by lastAlertedAt (design §4.2 feed-health alarm). Returns how many
 * feeds were included in an alert this run (0 if none were due).
 */
export async function alertUnhealthyFeeds(db: DrizzleDb, nowMs: number): Promise<number> {
  const feeds = await db.query.channelFeed.findMany({
    with: { property: { columns: { name: true } }, channel: { columns: { name: true } } }
  });

  const due = feeds.filter((f) => {
    const health = feedHealth(f, nowMs);
    if (health !== 'stale' && health !== 'error') return false;
    return !f.lastAlertedAt || hoursSince(f.lastAlertedAt, nowMs) >= ALERT_COOLDOWN_HOURS;
  });
  if (due.length === 0) return 0;

  const lines: FeedHealthLine[] = due.map((f) => ({
    propertyName: f.property.name,
    channelName: f.channel.name,
    health: feedHealth(f, nowMs),
    lastError: f.lastError
  }));
  await sendAlert(feedAlertMessage(lines));

  const iso = new Date(nowMs).toISOString();
  for (const f of due) {
    await db.update(channelFeed).set({ lastAlertedAt: iso }).where(eq(channelFeed.id, f.id));
  }
  return due.length;
}
