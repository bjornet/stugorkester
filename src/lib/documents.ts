// Which documents a booking needs, driven by the channel's capability
// attributes (design §4.4). Pure and client-safe so the picker and the
// renderer agree. The channel decides what the system must generate:
// a partial-contract channel (Stugknuten) needs a terms addendum; a no-contract
// channel (Stugnet, direct) needs a full rental agreement; a channel that
// doesn't handle payment needs a host confirmation + receipt. Check-in info is
// always useful.

export const documentTypeValues = [
  'terms_addendum',
  'rental_agreement',
  'booking_confirmation',
  'receipt',
  'checkin_info'
] as const;

export type DocumentType = (typeof documentTypeValues)[number];

export const documentTitles: Record<DocumentType, string> = {
  terms_addendum: 'Terms addendum',
  rental_agreement: 'Rental agreement',
  booking_confirmation: 'Booking confirmation',
  receipt: 'Payment receipt',
  checkin_info: 'Check-in information'
};

export interface ChannelCapabilities {
  contractCoverage: 'full' | 'partial' | 'none';
  supportsPayment: boolean;
}

/** The applicable document types for a booking on a channel, in send order. */
export function documentsForChannel(channel: ChannelCapabilities): DocumentType[] {
  const docs: DocumentType[] = [];
  if (channel.contractCoverage === 'partial') docs.push('terms_addendum');
  if (channel.contractCoverage === 'none') docs.push('rental_agreement');
  if (!channel.supportsPayment) {
    docs.push('booking_confirmation');
    docs.push('receipt');
  }
  docs.push('checkin_info');
  return docs;
}

export function isDocumentType(value: string | null): value is DocumentType {
  return value !== null && (documentTypeValues as readonly string[]).includes(value);
}
