// The calendar engine — "is range X–Y free?" over bookings and blockings.
// Pure and client-safe (no server imports) so both the load path and the UI
// can reason about overlaps from the same rules. See design doc §4.2.

/**
 * A half-open date interval `[start, end)`: the `end` date is not occupied.
 * This matches hospitality check-in/check-out semantics — a guest who checks
 * out on the 10th frees the 10th for the next check-in — and the design's rule
 * that blockings use "the same calendar logic as a booking" (§4.1).
 *
 * Dates are ISO `YYYY-MM-DD` strings, which compare chronologically under
 * plain lexicographic `<`/`>`, so no `Date` parsing is needed here.
 */
export interface DateInterval {
  /** First occupied date, inclusive (`YYYY-MM-DD`). */
  start: string;
  /** First free date again, exclusive (`YYYY-MM-DD`). */
  end: string;
}

/** True when two half-open intervals share at least one night. */
export function intervalsOverlap(a: DateInterval, b: DateInterval): boolean {
  return a.start < b.end && b.start < a.end;
}

export type OccupancyKind = 'booking' | 'blocking';

/**
 * Something that occupies the calendar for one property: a booking or a
 * blocking, reduced to just what conflict detection needs. `label` and
 * `status` are for human-readable warnings, not the overlap maths.
 */
export interface Occupancy extends DateInterval {
  id: string;
  kind: OccupancyKind;
  label: string;
  /** Booking status, when the occupancy is a booking; `null` for blockings. */
  status?: string | null;
}

/**
 * Occupancies that overlap `candidate`, excluding the row being edited
 * (`selfId`). Callers pass occupancies for a single property — cross-property
 * overlaps are not conflicts.
 */
export function findConflicts(
  candidate: DateInterval,
  occupancies: readonly Occupancy[],
  selfId?: string
): Occupancy[] {
  return occupancies.filter((o) => o.id !== selfId && intervalsOverlap(candidate, o));
}

/** True when `candidate` overlaps nothing on the property. */
export function isRangeFree(
  candidate: DateInterval,
  occupancies: readonly Occupancy[],
  selfId?: string
): boolean {
  return findConflicts(candidate, occupancies, selfId).length === 0;
}
