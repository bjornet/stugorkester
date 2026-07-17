import { describe, expect, it } from 'vitest';
import { channels } from './channels';
import { documentsForChannel } from '../../documents';

const byName = (name: string) => {
  const channel = channels.find((c) => c.name === name);
  if (!channel) throw new Error(`no seed channel named ${name}`);
  return channel;
};

describe('channel seed capabilities', () => {
  // Regression for #14: Airbnb's booking offer covers period/price/payment/
  // cancellation only, so a terms addendum is required (design §4.1) — it must
  // not be classified as no-contract, which would generate a full rental
  // agreement instead.
  it('Airbnb is a partial-contract, channel-payment channel', () => {
    const airbnb = byName('Airbnb');
    expect(airbnb.contractCoverage).toBe('partial');
    expect(airbnb.supportsPayment).toBe(true);
  });

  it('Airbnb generates a terms addendum, not a rental agreement', () => {
    const airbnb = byName('Airbnb');
    const docs = documentsForChannel({
      contractCoverage: airbnb.contractCoverage!,
      supportsPayment: airbnb.supportsPayment!
    });
    expect(docs).toContain('terms_addendum');
    expect(docs).not.toContain('rental_agreement');
  });
});
