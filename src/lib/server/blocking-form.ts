import { isIsoDate, text } from './forms';

export interface BlockingInput {
  propertyId: string;
  startDate: string;
  endDate: string;
  reason: string | null;
}

/** Raw field values echoed back to the form so nothing is lost on error. */
export type BlockingFormValues = Record<string, FormDataEntryValue | null>;

export type ParseResult =
  { ok: true; value: BlockingInput } | { ok: false; error: string; values: BlockingFormValues };

/**
 * Parse and validate a blocking create/update submission. A blocking is an
 * owner stay or maintenance window — the same half-open calendar logic as a
 * booking (design §4.1), just without a guest.
 */
export function parseBlocking(data: FormData): ParseResult {
  const values: BlockingFormValues = {
    propertyId: data.get('propertyId'),
    startDate: data.get('startDate'),
    endDate: data.get('endDate'),
    reason: data.get('reason')
  };

  const fail = (error: string): ParseResult => ({ ok: false, error, values });

  const propertyId = text(data, 'propertyId');
  const startDate = text(data, 'startDate');
  const endDate = text(data, 'endDate');

  if (!propertyId) return fail('Property is required.');
  if (!startDate || !isIsoDate(startDate)) return fail('Start date is required (YYYY-MM-DD).');
  if (!endDate || !isIsoDate(endDate)) return fail('End date is required (YYYY-MM-DD).');
  if (endDate <= startDate) return fail('End date must be after start date.');

  return {
    ok: true,
    value: { propertyId, startDate, endDate, reason: text(data, 'reason') }
  };
}
