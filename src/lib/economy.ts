// Economy helpers (design §2 tax, §4.1 LedgerEntry). Pure and client-safe so
// the ledger-posting rule and the summary view share one definition.

export interface LedgerSplit {
  income: number;
  commission: number;
  net: number;
}

/**
 * Split a booking's gross income into commission and net-to-owner given the
 * channel's commission rate (a fraction, e.g. 0.12 for Stugknuten's 12%).
 * A missing rate means 0% (direct channels).
 */
export function computeLedger(income: number, commissionRate: number | null): LedgerSplit {
  const commission = income * (commissionRate ?? 0);
  return { income, commission, net: income - commission };
}

/** The gross income a booking realises: its total, or base + cleaning fee. */
export function bookingIncome(b: {
  totalPrice: number | null;
  basePrice: number | null;
  cleaningFee: number | null;
}): number {
  if (b.totalPrice !== null) return b.totalPrice;
  return (b.basePrice ?? 0) + (b.cleaningFee ?? 0);
}

export const STANDARD_DEDUCTION = 40_000;
export const INCOME_DEDUCTION_RATE = 0.2;
export const CAPITAL_TAX_RATE = 0.3;

export interface TaxEstimate {
  grossIncome: number;
  standardDeduction: number;
  incomeDeduction: number;
  taxable: number;
  tax: number;
}

/**
 * Estimate Swedish private-rental tax for a year's gross rental income: a flat
 * 40 000 kr standard deduction plus 20% of the income are deductible, and the
 * surplus is taxed at 30% (capital income). This is a rough declaration aid,
 * not tax advice — the 40 000 kr allowance is per person across all private
 * rentals, so a multi-property or multi-owner situation needs care.
 */
export function estimateTax(grossIncome: number): TaxEstimate {
  const incomeDeduction = grossIncome * INCOME_DEDUCTION_RATE;
  const taxable = Math.max(0, grossIncome - STANDARD_DEDUCTION - incomeDeduction);
  return {
    grossIncome,
    standardDeduction: STANDARD_DEDUCTION,
    incomeDeduction,
    taxable,
    tax: taxable * CAPITAL_TAX_RATE
  };
}
