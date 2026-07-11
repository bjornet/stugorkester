import { sync, type VEvent } from 'node-ical';
import type { FeedEvent } from './diff';

// node-ical parses `VALUE=DATE` all-day events as UTC midnight, so the UTC
// date part is the calendar day regardless of the host timezone.
function toYmd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

/**
 * Parse an iCal feed into busy intervals. Channel export feeds (Airbnb et al.)
 * carry only VEVENTs with a UID and a date range — no guest or price data
 * (design §2) — so that is all we extract. Events missing a UID or end date
 * are skipped.
 */
export function parseIcalFeed(icsText: string): FeedEvent[] {
  const parsed = sync.parseICS(icsText);
  const events: FeedEvent[] = [];

  for (const component of Object.values(parsed)) {
    // node-ical's union isn't a clean discriminated type, so narrow by hand.
    if (!component || component.type !== 'VEVENT') continue;
    const event = component as VEvent;
    if (!event.uid || !event.start || !event.end) continue;
    events.push({ uid: String(event.uid), start: toYmd(event.start), end: toYmd(event.end) });
  }

  return events;
}
