/**
 * Pure Investment Data Hub calculator math. No React, no filesystem, no I/O —
 * importable from "use client" calculators and from tests alike.
 *
 * Every result is an estimate for illustration. Nothing here is advice.
 */

export type PayoutFrequency = "monthly" | "quarterly" | "half-yearly" | "annual";

export const PAYOUTS_PER_YEAR: Record<PayoutFrequency, number> = {
  monthly: 12,
  quarterly: 4,
  "half-yearly": 2,
  annual: 1,
};

export interface GrowthResult {
  /** Money the investor actually put in. */
  invested: number;
  /** Estimated value at the end of the term. */
  future: number;
  /** future − invested. */
  gain: number;
}

/** Whole-year growth path for charts/tables: value at the end of each year. */
export type YearPoint = { year: number; invested: number; value: number };

function assertPositive(name: string, v: number): void {
  if (!Number.isFinite(v) || v < 0) throw new Error(`${name} must be a non-negative finite number`);
}

/**
 * SIP: a fixed contribution at the START of every month, compounded monthly.
 * future = Σ contribution × (1 + r)^(n − i), r = annualRate/12, i = 0..n−1.
 */
export function sipFuture(monthly: number, annualRatePct: number, years: number, stepUpPct = 0): GrowthResult & { path: YearPoint[] } {
  assertPositive("monthly", monthly);
  assertPositive("years", years);
  const months = Math.round(years * 12);
  const r = annualRatePct / 100 / 12;
  let invested = 0;
  let value = 0;
  let contribution = monthly;
  const path: YearPoint[] = [];
  for (let i = 0; i < months; i++) {
    if (i > 0 && stepUpPct > 0 && i % 12 === 0) contribution *= 1 + stepUpPct / 100; // yearly step-up
    value = (value + contribution) * (1 + r);
    invested += contribution;
    if ((i + 1) % 12 === 0) path.push({ year: (i + 1) / 12, invested, value });
  }
  // Sub-year terms still return a path point so tables have something to show.
  if (months > 0 && months % 12 !== 0) path.push({ year: months / 12, invested, value });
  return { invested, future: value, gain: value - invested, path };
}

/**
 * Lump sum compounded monthly (same monthly convention as SIP so the two
 * calculators are comparable side by side).
 */
export function lumpFuture(principal: number, annualRatePct: number, years: number): GrowthResult & { path: YearPoint[] } {
  assertPositive("principal", principal);
  assertPositive("years", years);
  const r = annualRatePct / 100 / 12;
  const path: YearPoint[] = [];
  let value = principal;
  const wholeYears = Math.floor(years);
  for (let y = 1; y <= wholeYears; y++) {
    value = principal * Math.pow(1 + r, 12 * y);
    path.push({ year: y, invested: principal, value });
  }
  value = principal * Math.pow(1 + r, 12 * years);
  if (years > 0 && years % 1 !== 0) path.push({ year: years, invested: principal, value });
  return { invested: principal, future: value, gain: value - principal, path };
}

export interface DepositResult {
  principal: number;
  /** Interest before tax. */
  grossInterest: number;
  /** Tax deducted (TDS-style estimate at the configured rate). */
  tax: number;
  /** principal + grossInterest − tax. */
  netMaturity: number;
}

/**
 * Fixed deposit (FDR): compound interest with a selectable compounding
 * frequency, tax applied to the interest at maturity as an estimate.
 */
export function fdrMaturity(
  principal: number,
  annualRatePct: number,
  years: number,
  compoundsPerYear: 1 | 2 | 4 | 12,
  taxPct = 0
): DepositResult {
  assertPositive("principal", principal);
  assertPositive("years", years);
  const r = annualRatePct / 100 / compoundsPerYear;
  const n = compoundsPerYear * years;
  const maturity = principal * Math.pow(1 + r, n);
  const grossInterest = maturity - principal;
  const tax = (grossInterest * taxPct) / 100;
  return { principal, grossInterest, tax, netMaturity: maturity - tax };
}

export interface SonchayaResult {
  principal: number;
  ratePct: number;
  frequency: PayoutFrequency;
  /** Gross interest per payout. */
  payoutPerPeriod: number;
  /** Number of payouts over the whole term. */
  payoutCount: number;
  grossInterest: number;
  tax: number;
  netInterest: number;
  /** Principal returned at maturity (non-compounding schemes). */
  maturityValue: number;
  /** Total cash the investor ends up with: maturity + net interest. */
  totalValue: number;
}

/**
 * Sonchayapatra / savings-scheme payout math.
 *
 * Standard Bangladeshi savings schemes pay interest out at a fixed frequency
 * and return the principal at maturity — they do NOT compound (unless the
 * investor opts to reinvest, which is modelled separately by the caller).
 * Tax is deducted at source on the interest.
 */
export function sonchayapatraPayout(
  principal: number,
  ratePct: number,
  years: number,
  frequency: PayoutFrequency,
  taxPct = 0
): SonchayaResult {
  assertPositive("principal", principal);
  assertPositive("years", years);
  const perYear = PAYOUTS_PER_YEAR[frequency];
  const payoutPerPeriod = (principal * ratePct) / 100 / perYear;
  const payoutCount = Math.round(years * perYear);
  const grossInterest = payoutPerPeriod * payoutCount;
  const tax = (grossInterest * taxPct) / 100;
  const netInterest = grossInterest - tax;
  return {
    principal,
    ratePct,
    frequency,
    payoutPerPeriod,
    payoutCount,
    grossInterest,
    tax,
    netInterest,
    maturityValue: principal,
    totalValue: principal + netInterest,
  };
}

/**
 * Same scheme with the interest left to compound at maturity
 * (auto-renewal / reinvestment option), tax applied to the interest at the end.
 */
export function sonchayapatraCompounding(
  principal: number,
  ratePct: number,
  years: number,
  frequency: PayoutFrequency,
  taxPct = 0
): SonchayaResult {
  assertPositive("principal", principal);
  assertPositive("years", years);
  const perYear = PAYOUTS_PER_YEAR[frequency];
  const maturityValue = principal * Math.pow(1 + ratePct / 100 / perYear, perYear * years);
  const grossInterest = maturityValue - principal;
  const tax = (grossInterest * taxPct) / 100;
  const netInterest = grossInterest - tax;
  const payoutCount = Math.round(years * perYear);
  return {
    principal,
    ratePct,
    frequency,
    payoutPerPeriod: (principal * ratePct) / 100 / perYear, // what the payout WOULD have been
    payoutCount,
    grossInterest,
    tax,
    netInterest,
    maturityValue: maturityValue - tax,
    totalValue: maturityValue - tax,
  };
}
