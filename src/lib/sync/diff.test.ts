import { describe, expect, it } from 'vitest';
import { diffShadowBookings, type ExistingShadow, type FeedEvent } from './diff';

const ev = (uid: string, start: string, end: string): FeedEvent => ({ uid, start, end });
const shadow = (id: string, uid: string, checkIn: string, checkOut: string): ExistingShadow => ({
  id,
  uid,
  checkIn,
  checkOut
});

describe('diffShadowBookings', () => {
  it('inserts events with unseen UIDs', () => {
    const diff = diffShadowBookings([ev('a', '2026-08-01', '2026-08-05')], []);
    expect(diff.toInsert).toEqual([ev('a', '2026-08-01', '2026-08-05')]);
    expect(diff.toUpdate).toEqual([]);
    expect(diff.toDelete).toEqual([]);
  });

  it('leaves unchanged events alone', () => {
    const existing = [shadow('s1', 'a', '2026-08-01', '2026-08-05')];
    const diff = diffShadowBookings([ev('a', '2026-08-01', '2026-08-05')], existing);
    expect(diff).toEqual({ toInsert: [], toUpdate: [], toDelete: [] });
  });

  it('updates when a matched UID has different dates', () => {
    const existing = [shadow('s1', 'a', '2026-08-01', '2026-08-05')];
    const diff = diffShadowBookings([ev('a', '2026-08-01', '2026-08-07')], existing);
    expect(diff.toUpdate).toEqual([{ id: 's1', event: ev('a', '2026-08-01', '2026-08-07') }]);
    expect(diff.toInsert).toEqual([]);
    expect(diff.toDelete).toEqual([]);
  });

  it('deletes existing shadows whose UID vanished from the feed', () => {
    const existing = [
      shadow('s1', 'a', '2026-08-01', '2026-08-05'),
      shadow('s2', 'b', '2026-09-01', '2026-09-03')
    ];
    const diff = diffShadowBookings([ev('a', '2026-08-01', '2026-08-05')], existing);
    expect(diff.toDelete).toEqual(['s2']);
    expect(diff.toInsert).toEqual([]);
    expect(diff.toUpdate).toEqual([]);
  });

  it('handles a mixed insert/update/delete in one pass', () => {
    const existing = [
      shadow('s1', 'keep', '2026-08-01', '2026-08-05'),
      shadow('s2', 'move', '2026-09-01', '2026-09-03'),
      shadow('s3', 'gone', '2026-10-01', '2026-10-02')
    ];
    const events = [
      ev('keep', '2026-08-01', '2026-08-05'),
      ev('move', '2026-09-01', '2026-09-04'),
      ev('new', '2026-11-01', '2026-11-03')
    ];
    const diff = diffShadowBookings(events, existing);
    expect(diff.toInsert).toEqual([ev('new', '2026-11-01', '2026-11-03')]);
    expect(diff.toUpdate).toEqual([{ id: 's2', event: ev('move', '2026-09-01', '2026-09-04') }]);
    expect(diff.toDelete).toEqual(['s3']);
  });

  it('ignores duplicate feed UIDs, keeping the first', () => {
    const events = [ev('a', '2026-08-01', '2026-08-05'), ev('a', '2026-12-01', '2026-12-02')];
    const diff = diffShadowBookings(events, []);
    expect(diff.toInsert).toEqual([ev('a', '2026-08-01', '2026-08-05')]);
  });
});
