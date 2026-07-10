// Client-safe display helpers. No server imports here.

/** Format a stored money amount (kr) for display, or a dash when absent. */
export function money(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return '–';
  return new Intl.NumberFormat('sv-SE', {
    style: 'currency',
    currency: 'SEK',
    maximumFractionDigits: 0
  }).format(amount);
}

/** Human label for a booking status enum value. */
export function bookingStatusLabel(status: string): string {
  return status.replace(/_/g, ' ');
}
