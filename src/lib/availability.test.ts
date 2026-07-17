import { describe, expect, it } from 'vitest';
import {
  conflictingBookingIds,
  findConflicts,
  intervalsOverlap,
  isRangeFree,
  type Occupancy,
  type PropertyOccupancy
} from './availability';

describe('intervalsOverlap', () => {
  it('detects a plain overlap', () => {
    expect(
      intervalsOverlap(
        { start: '2026-07-01', end: '2026-07-10' },
        { start: '2026-07-05', end: '2026-07-15' }
      )
    ).toBe(true);
  });

  it('treats touching intervals as free (half-open)', () => {
    // One checks out on the 10th, the next checks in on the 10th → no overlap.
    expect(
      intervalsOverlap(
        { start: '2026-07-01', end: '2026-07-10' },
        { start: '2026-07-10', end: '2026-07-15' }
      )
    ).toBe(false);
  });

  it('is symmetric', () => {
    const a = { start: '2026-07-01', end: '2026-07-10' };
    const b = { start: '2026-07-08', end: '2026-07-20' };
    expect(intervalsOverlap(a, b)).toBe(intervalsOverlap(b, a));
  });

  it('detects full containment', () => {
    expect(
      intervalsOverlap(
        { start: '2026-07-01', end: '2026-07-31' },
        { start: '2026-07-10', end: '2026-07-12' }
      )
    ).toBe(true);
  });

  it('reports separate intervals as free', () => {
    expect(
      intervalsOverlap(
        { start: '2026-07-01', end: '2026-07-05' },
        { start: '2026-07-20', end: '2026-07-25' }
      )
    ).toBe(false);
  });

  it('detects a single shared night', () => {
    expect(
      intervalsOverlap(
        { start: '2026-07-01', end: '2026-07-06' },
        { start: '2026-07-05', end: '2026-07-06' }
      )
    ).toBe(true);
  });
});

const occ = (
  id: string,
  start: string,
  end: string,
  extra: Partial<Occupancy> = {}
): Occupancy => ({
  id,
  kind: 'booking',
  label: id,
  start,
  end,
  ...extra
});

describe('findConflicts', () => {
  const existing: Occupancy[] = [
    occ('a', '2026-07-01', '2026-07-05'),
    occ('b', '2026-07-10', '2026-07-15'),
    occ('c', '2026-08-01', '2026-08-03', { kind: 'blocking', status: null })
  ];

  it('returns overlapping occupancies', () => {
    const hits = findConflicts({ start: '2026-07-04', end: '2026-07-11' }, existing);
    expect(hits.map((h) => h.id)).toEqual(['a', 'b']);
  });

  it('returns nothing for a free gap', () => {
    expect(findConflicts({ start: '2026-07-05', end: '2026-07-10' }, existing)).toEqual([]);
  });

  it('excludes the row being edited', () => {
    // Editing "b" to shift by a day should not conflict with its own old row.
    const hits = findConflicts({ start: '2026-07-11', end: '2026-07-16' }, existing, 'b');
    expect(hits).toEqual([]);
  });

  it('finds blocking conflicts too', () => {
    const hits = findConflicts({ start: '2026-08-02', end: '2026-08-04' }, existing);
    expect(hits.map((h) => h.id)).toEqual(['c']);
  });
});

describe('isRangeFree', () => {
  const existing: Occupancy[] = [occ('a', '2026-07-01', '2026-07-05')];

  it('is true for a non-overlapping range', () => {
    expect(isRangeFree({ start: '2026-07-05', end: '2026-07-09' }, existing)).toBe(true);
  });

  it('is false for an overlapping range', () => {
    expect(isRangeFree({ start: '2026-07-03', end: '2026-07-09' }, existing)).toBe(false);
  });
});

describe('conflictingBookingIds', () => {
  const pocc = (
    id: string,
    propertyId: string,
    start: string,
    end: string,
    extra: Partial<PropertyOccupancy> = {}
  ): PropertyOccupancy => ({ ...occ(id, start, end, extra), propertyId });

  it('flags both bookings when two overlap on the same property', () => {
    const ids = conflictingBookingIds([
      pocc('a', 'p1', '2026-07-01', '2026-07-05'),
      pocc('b', 'p1', '2026-07-04', '2026-07-08')
    ]);
    expect([...ids].sort()).toEqual(['a', 'b']);
  });

  it('does not flag non-overlapping or adjacent (half-open) bookings', () => {
    const ids = conflictingBookingIds([
      pocc('a', 'p1', '2026-07-01', '2026-07-05'),
      pocc('b', 'p1', '2026-07-05', '2026-07-09')
    ]);
    expect(ids.size).toBe(0);
  });

  it('flags a booking that overlaps a blocking, but not the blocking itself', () => {
    const ids = conflictingBookingIds([
      pocc('a', 'p1', '2026-07-01', '2026-07-05'),
      pocc('block', 'p1', '2026-07-03', '2026-07-04', { kind: 'blocking', status: null })
    ]);
    expect([...ids]).toEqual(['a']);
  });

  it('never treats stays on different properties as conflicts', () => {
    const ids = conflictingBookingIds([
      pocc('a', 'p1', '2026-07-01', '2026-07-05'),
      pocc('b', 'p2', '2026-07-01', '2026-07-05')
    ]);
    expect(ids.size).toBe(0);
  });
});
