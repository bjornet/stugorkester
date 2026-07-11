import { describe, expect, it } from 'vitest';
import { bookingIncome, computeLedger, estimateTax } from './economy';

describe('computeLedger', () => {
  it('splits income by the commission rate', () => {
    expect(computeLedger(1000, 0.12)).toEqual({ income: 1000, commission: 120, net: 880 });
  });

  it('treats a missing rate as 0%', () => {
    expect(computeLedger(1000, null)).toEqual({ income: 1000, commission: 0, net: 1000 });
  });
});

describe('bookingIncome', () => {
  it('prefers the total price when set', () => {
    expect(bookingIncome({ totalPrice: 5000, basePrice: 4000, cleaningFee: 800 })).toBe(5000);
  });

  it('falls back to base + cleaning fee', () => {
    expect(bookingIncome({ totalPrice: null, basePrice: 4000, cleaningFee: 800 })).toBe(4800);
  });

  it('treats missing components as zero', () => {
    expect(bookingIncome({ totalPrice: null, basePrice: null, cleaningFee: null })).toBe(0);
  });
});

describe('estimateTax', () => {
  it('is zero when income is within the allowances', () => {
    // 40000 + 20% of 40000 = 48000 deductible → nothing taxable.
    expect(estimateTax(40_000).tax).toBe(0);
    expect(estimateTax(40_000).taxable).toBe(0);
  });

  it('taxes the surplus at 30% after both deductions', () => {
    // gross 100000 → deduct 40000 + 20000 = 60000 → taxable 40000 → tax 12000.
    const est = estimateTax(100_000);
    expect(est.incomeDeduction).toBe(20_000);
    expect(est.taxable).toBe(40_000);
    expect(est.tax).toBe(12_000);
  });

  it('never goes negative', () => {
    expect(estimateTax(0)).toEqual({
      grossIncome: 0,
      standardDeduction: 40_000,
      incomeDeduction: 0,
      taxable: 0,
      tax: 0
    });
  });
});
