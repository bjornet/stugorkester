import { describe, expect, it } from 'vitest';
import { conflictTaskTitle } from './sync';
import type { Occupancy } from '../availability';

const occ = (over: Partial<Occupancy> = {}): Occupancy => ({
  id: 'x',
  kind: 'booking',
  label: 'booking',
  start: '2026-08-03',
  end: '2026-08-07',
  ...over
});

describe('conflictTaskTitle', () => {
  it('names the firm entry the import overlaps, not just the imported dates', () => {
    const title = conflictTaskTitle({ start: '2026-08-01', end: '2026-08-05' }, [occ()]);
    expect(title).toBe(
      'Sync conflict: imported 2026-08-01 → 2026-08-05 overlaps booking 2026-08-03 → 2026-08-07'
    );
  });

  it('lists every clashing booking and blocking', () => {
    const title = conflictTaskTitle({ start: '2026-08-01', end: '2026-08-10' }, [
      occ({ label: 'booking', start: '2026-08-03', end: '2026-08-05' }),
      occ({ id: 'y', kind: 'blocking', label: 'blocking', start: '2026-08-06', end: '2026-08-08' })
    ]);
    expect(title).toContain('booking 2026-08-03 → 2026-08-05');
    expect(title).toContain('blocking 2026-08-06 → 2026-08-08');
  });
});
