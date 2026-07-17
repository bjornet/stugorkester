import { describe, expect, it } from 'vitest';
import { documentsForChannel, isDocumentType } from './documents';

describe('documentsForChannel', () => {
  it('partial coverage (e.g. Stugknuten) needs a terms addendum', () => {
    const docs = documentsForChannel({ contractCoverage: 'partial', supportsPayment: true });
    expect(docs).toEqual(['terms_addendum', 'checkin_info']);
  });

  it('no coverage with channel payment needs a rental agreement', () => {
    const docs = documentsForChannel({ contractCoverage: 'none', supportsPayment: true });
    expect(docs).toEqual(['rental_agreement', 'checkin_info']);
  });

  it('no coverage without channel payment (e.g. Stugnet) needs agreement, confirmation, receipt', () => {
    const docs = documentsForChannel({ contractCoverage: 'none', supportsPayment: false });
    expect(docs).toEqual(['rental_agreement', 'booking_confirmation', 'receipt', 'checkin_info']);
  });

  it('full coverage with channel payment only needs check-in info', () => {
    const docs = documentsForChannel({ contractCoverage: 'full', supportsPayment: true });
    expect(docs).toEqual(['checkin_info']);
  });
});

describe('isDocumentType', () => {
  it('accepts known types and rejects others', () => {
    expect(isDocumentType('receipt')).toBe(true);
    expect(isDocumentType('nonsense')).toBe(false);
    expect(isDocumentType(null)).toBe(false);
  });
});
