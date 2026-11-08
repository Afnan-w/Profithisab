export type FundType = "growth" | "balanced" | "income";

/** Raw catalog entry — anchors come from published NAV history of the fund (see README). */
export interface FundSeed {
  slug: string;
  name: string;
  acronym: string;
  amc: string;
  amcSlug: string;
  type: FundType;
  shariah: boolean;
  /** AMC verified = NAV/dividend history cross-checked with the AMC. */
  verified: boolean;
  /** Published inception, first public NAV month. */
  inception: string; // "YYYY-MM"
  /** 3-year annualized total return (one-time, dividends reinvested), as published. null if <3y history. */
  g3: number | null;
  /** Annualized since launch (published). */
  gSince: number | null;
  /** Worst NAV fall (max drawdown) as published. null if not published. */
  worstFall: number | null;
  /** Total fee % per year (management + recurring), from the prospectus / fact sheet. */
  fee: number;
  /** AUM in ৳ crore. */
  aumCr: number;
  /** Annual cash dividend as % of NAV (0 = pays no regular dividend). */
  divAnnualPct: number;
  /** Months (1-12) when dividends are paid. */
  divMonths: number[];
  /** Typical minimum application. */
  minTaka?: number;
}

export interface NavPoint {
  /** ISO month key "YYYY-MM" */
  m: string;
  /** Month-end NAV (৳). */
  nav: number;
  /** Cash dividend paid that month, per unit (৳). */
  div: number;
}

export interface Fund {
  slug: string;
  name: string;
  acronym: string;
  amc: string;
  amcSlug: string;
  type: FundType;
  shariah: boolean;
  verified: boolean;
  inception: string;
  fee: number;
  aumCr: number;
  minTaka: number;
  series: NavPoint[];
}

/** Computed headline metrics shared across pages. */
export interface FundMetrics {
  asOf: string; // ISO month of latest NAV
  latestNav: number;
  months: number; // tracked history length
  g1: number | null; // 1y annualized total return
  g3: number | null;
  g5: number | null;
  gMax: number | null; // within tracked window
  worstFall: number;
  vol: number; // annualized volatility
  beta: number; // vs DSEX
  positiveMonths3y: number | null; // consistency
  sip: {
    irr3: number | null; // annualized SIP return for ৳5,000/mo over 3y
    final3: number | null; // resulting value
  };
  divPaid3y: number; // total cash dividend per unit over 3y (৳)
}
