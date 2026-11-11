import type { DividendRow, NavRow } from "@/lib/schema";
import type { PeriodId } from "@/lib/config";

export type { DividendRow, NavRow } from "@/lib/schema";
export type { PeriodId } from "@/lib/config";

export type FundType = "growth" | "balanced" | "income";
export type Completeness = "complete" | "partial" | "missing";

export interface FundSource {
  name: string;
  url?: string | null;
  asOf?: string | null;
  kind: "export" | "demo" | "manual" | "public-disclosure";
}

/** A monthly point used by the SVG charts (kept small for the fund page). */
export interface NavPoint {
  /** ISO month key "YYYY-MM" */
  m: string;
  /** Month-end NAV (৳). */
  nav: number;
  /** Cash dividend paid that month, per unit (৳). */
  div: number;
}

export interface Fund {
  id: string;
  slug: string;
  name: string;
  acronym: string;
  amcId: string;
  amc: string;
  amcSlug: string;
  type: FundType;
  shariah: boolean;
  /** True only when a real entry exists in verification.json AND the licence permits badges. */
  verified: boolean;
  launchDate: string | null;
  /** "YYYY-MM" for compact copy. */
  inception: string | null;
  fee: number | null;
  fundSize: number | null;
  minTaka: number | null;
  source: FundSource;
  completeness: Completeness;
  isStale: boolean;
  latestNavDate: string | null;
  /** Full NAV history (daily or weekly as supplied). */
  nav: NavRow[];
  dividends: DividendRow[];
  /** Month-end series for charts. */
  series: NavPoint[];
}

export interface PeriodReturn {
  /** Annualised total return as a fraction (0.12 = 12%). */
  cagr: number;
  startDate: string;
  endDate: string;
  days: number;
  /** Final value of ৳1 invested. */
  growth: number;
}

export interface SipResult {
  /** Money-weighted annual return as a fraction. */
  xirr: number;
  final: number;
  invested: number;
  months: number;
  startDate: string;
  endDate: string;
}

export interface Drawdown {
  /** Negative fraction (-0.23 = a 23% fall). */
  value: number;
  peakDate: string | null;
  troughDate: string | null;
}

/** Computed headline metrics shared across pages. */
export interface FundMetrics {
  latestNav: number;
  latestNavDate: string;
  /** ISO month of latest NAV, kept for chart labels. */
  asOf: string;
  rows: number;
  g1: number | null;
  g3: number | null;
  g5: number | null;
  gMax: number | null;
  returns: Record<PeriodId, PeriodReturn | null>;
  worstFall: number;
  drawdown: Drawdown;
  vol: number | null;
  beta: number | null;
  positiveMonths3y: number | null;
  sip: {
    irr1: number | null;
    irr3: number | null;
    irr5: number | null;
    final3: number | null;
    invested3: number | null;
    /** Full result objects for the compare/detail pages. */
    runs: Partial<Record<PeriodId, SipResult | null>>;
  };
  /** Total cash dividend per unit over the trailing 3 years. */
  divPaid3y: number;
  /** Share of months with a dividend declaration in the last 3 years. */
  dividendCount3y: number;
}

/** Everything the browser calculator needs for one fund. */
export interface CalcFund {
  id: string;
  slug: string;
  name: string;
  acronym: string;
  amc: string;
  type: FundType;
  shariah: boolean;
  fee: number | null;
  fundSize: number | null;
  launchDate: string | null;
  latestNav: number;
  latestNavDate: string;
  months: NavRow[];
  dividends: DividendRow[];
  completeness: Completeness;
  isStale: boolean;
}

export type CalculatorMode = "sip" | "lump";
export type DividendMode = "reinvest" | "cash";
