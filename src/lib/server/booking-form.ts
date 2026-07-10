import { bookingStatusValues } from './db/schema';
import { isIsoDate, isOneOf, number, text } from './forms';

export type BookingStatus = (typeof bookingStatusValues)[number];

export interface BookingInput {
  propertyId: string;
  channelId: string;
  guestId: string | null;
  status: BookingStatus;
  checkIn: string;
  checkOut: string;
  basePrice: number | null;
  cleaningFee: number | null;
  totalPrice: number | null;
  cancellationPolicy: string | null;
  externalRef: string | null;
}

/** Raw field values echoed back to the form so nothing is lost on error. */
export type BookingFormValues = Record<string, FormDataEntryValue | null>;

export type ParseResult =
  { ok: true; value: BookingInput } | { ok: false; error: string; values: BookingFormValues };

const PRICE_FIELDS = ['basePrice', 'cleaningFee', 'totalPrice'] as const;

/**
 * Parse and validate a booking create/update submission. Both actions share
 * this so their rules can't drift apart.
 */
export function parseBooking(data: FormData): ParseResult {
  const values: BookingFormValues = {
    propertyId: data.get('propertyId'),
    channelId: data.get('channelId'),
    guestId: data.get('guestId'),
    status: data.get('status'),
    checkIn: data.get('checkIn'),
    checkOut: data.get('checkOut'),
    basePrice: data.get('basePrice'),
    cleaningFee: data.get('cleaningFee'),
    totalPrice: data.get('totalPrice'),
    cancellationPolicy: data.get('cancellationPolicy'),
    externalRef: data.get('externalRef')
  };

  const fail = (error: string): ParseResult => ({ ok: false, error, values });

  const propertyId = text(data, 'propertyId');
  const channelId = text(data, 'channelId');
  const guestId = text(data, 'guestId');
  const status = text(data, 'status');
  const checkIn = text(data, 'checkIn');
  const checkOut = text(data, 'checkOut');

  if (!propertyId) return fail('Property is required.');
  if (!channelId) return fail('Channel is required.');
  if (!isOneOf(status, bookingStatusValues)) return fail('Invalid status.');
  if (!checkIn || !isIsoDate(checkIn)) return fail('Check-in date is required (YYYY-MM-DD).');
  if (!checkOut || !isIsoDate(checkOut)) return fail('Check-out date is required (YYYY-MM-DD).');
  if (checkOut <= checkIn) return fail('Check-out must be after check-in.');

  const prices: Record<(typeof PRICE_FIELDS)[number], number | null> = {
    basePrice: null,
    cleaningFee: null,
    totalPrice: null
  };
  for (const field of PRICE_FIELDS) {
    const parsed = number(data, field);
    if (parsed === null) return fail(`${field} must be a number.`);
    if (parsed !== undefined && parsed < 0) return fail(`${field} cannot be negative.`);
    prices[field] = parsed ?? null;
  }

  return {
    ok: true,
    value: {
      propertyId,
      channelId,
      guestId,
      status,
      checkIn,
      checkOut,
      basePrice: prices.basePrice,
      cleaningFee: prices.cleaningFee,
      totalPrice: prices.totalPrice,
      cancellationPolicy: text(data, 'cancellationPolicy'),
      externalRef: text(data, 'externalRef')
    }
  };
}
