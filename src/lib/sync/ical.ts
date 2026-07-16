// node-ical is CommonJS, so it must be imported via its default export (a
// named `{ sync }` import fails at runtime under Node ESM). The VEvent type is
// erased at runtime, so it can come through a type-only import.
import ical from 'node-ical';
import type { VEvent } from 'node-ical';
import type { FeedEvent } from './diff';

// node-ical parses `VALUE=DATE` all-day events at *local* midnight, so read the
// date back through the local parts. Using `toISOString()` (UTC) would shift
// the calendar day by one in any timezone east of UTC.
function toYmd(d: Date): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parse an iCal feed into busy intervals. Channel export feeds (Airbnb et al.)
 * carry only VEVENTs with a UID and a date range — no guest or price data
 * (design §2) — so that is all we extract. Events missing a UID or end date
 * are skipped.
 */
export function parseIcalFeed(icsText: string): FeedEvent[] {
  const parsed = ical.sync.parseICS(icsText);
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
