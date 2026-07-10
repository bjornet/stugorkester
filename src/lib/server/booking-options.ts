/** Label for a booking in a dropdown: "2026-08-01 → 2026-08-05 · Sjöstugan". */
export function bookingOptionLabel(b: {
  checkIn: string;
  checkOut: string;
  property: { name: string };
}): string {
  return `${b.checkIn} → ${b.checkOut} · ${b.property.name}`;
}
