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

/** An occupancy tagged with the property it belongs to. */
export interface PropertyOccupancy extends Occupancy {
  propertyId: string;
}

/**
 * Ids of the **booking** occupancies that overlap another occupancy on the same
 * property — used to flag clashing rows in the bookings list. Blockings still
 * count as something to clash with, but they aren't rows so aren't returned.
 * Overlaps are only within a property (a stay elsewhere is never a conflict).
 */
export function conflictingBookingIds(occupancies: readonly PropertyOccupancy[]): Set<string> {
  const byProperty = new Map<string, PropertyOccupancy[]>();
  for (const o of occupancies) {
    const peers = byProperty.get(o.propertyId) ?? [];
    peers.push(o);
    byProperty.set(o.propertyId, peers);
  }

  const ids = new Set<string>();
  for (const o of occupancies) {
    if (o.kind !== 'booking') continue;
    if (findConflicts(o, byProperty.get(o.propertyId) ?? [], o.id).length > 0) ids.add(o.id);
  }
  return ids;
}
