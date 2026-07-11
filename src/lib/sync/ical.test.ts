import { describe, expect, it } from 'vitest';
import { parseIcalFeed } from './ical';

function ics(...events: string[][]): string {
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//test//EN'];
  for (const e of events) lines.push('BEGIN:VEVENT', ...e, 'END:VEVENT');
  lines.push('END:VCALENDAR');
  return lines.join('\r\n');
}

describe('parseIcalFeed', () => {
  it('extracts uid and half-open dates from all-day events', () => {
    const feed = ics(
      ['UID:evt-1', 'DTSTART;VALUE=DATE:20260801', 'DTEND;VALUE=DATE:20260805', 'SUMMARY:Reserved'],
      ['UID:evt-2', 'DTSTART;VALUE=DATE:20260910', 'DTEND;VALUE=DATE:20260912', 'SUMMARY:Reserved']
    );
    const events = parseIcalFeed(feed).sort((a, b) => a.uid.localeCompare(b.uid));
    expect(events).toEqual([
      { uid: 'evt-1', start: '2026-08-01', end: '2026-08-05' },
      { uid: 'evt-2', start: '2026-09-10', end: '2026-09-12' }
    ]);
  });

  it('skips events without a uid', () => {
    const feed = ics(['DTSTART;VALUE=DATE:20260801', 'DTEND;VALUE=DATE:20260805']);
    expect(parseIcalFeed(feed)).toEqual([]);
  });

  it('treats a date-only event with no DTEND as a single day (end = start + 1)', () => {
    const feed = ics(['UID:one-day', 'DTSTART;VALUE=DATE:20260801']);
    expect(parseIcalFeed(feed)).toEqual([
      { uid: 'one-day', start: '2026-08-01', end: '2026-08-02' }
    ]);
  });

  it('returns an empty array for a feed with no events', () => {
    expect(parseIcalFeed(ics())).toEqual([]);
  });
});
