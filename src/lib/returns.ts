import { getDataset, availableBenchmarks } from "@/lib/data";
import {
  alignBenchTrail,
  annualisedVolatility,
  betaVsIndex,
  dividendsBetween,
  latestNav,
  lumpSum,
  maxDrawdown,
  monthEndSeries,
  positiveMonths,
  sipRun as sipCalc,
  type BenchLevel,
  type ValuePoint,
} from "@/lib/calc";
import { addDays, addMonths } from "@/lib/date";
import { linePath } from "@/lib/chart";
import type { Fund, FundMetrics, FundType, PeriodReturn, SipResult } from "@/lib/types";

/**
 * Server-side view over the committed dataset. Never import this module from a
 * `"use client"` component: it reads the filesystem through src/lib/data.ts.
 * The browser calculator receives precomputed monthly data as props instead.
 */

const ds = getDataset();

export const ALL_FUNDS: Fund[] = ds.funds;
export const META = ds.meta;
export const IS_DEMO = ds.isDemo;
export const LICENSE = ds.license;
export const ATTRIBUTION = ds.attribution;
export const AMCS = ds.amcs;
export const REVIEW = ds.review;

export const TOTAL_AUM_CR = ALL_FUNDS.reduce((sum, f) => sum + (f.fundSize ?? 0), 0);
export const FUNDS_WITH_SIZE = ALL_FUNDS.filter((f) => f.fundSize !== null).length;
export const VERIFIED_COUNT = ALL_FUNDS.filter((f) => f.verified).length;
export const SHARIAH_COUNT = ALL_FUNDS.filter((f) => f.shariah).length;
export const WITH_NAV_COUNT = ALL_FUNDS.filter((f) => f.nav.length > 0).length;
export const STALE_COUNT = ALL_FUNDS.filter((f) => f.isStale).length;



const BY_SLUG = new Map(ALL_FUNDS.map((f) => [f.slug, f]));

export function getFund(slug: string): Fund | undefined {
  return BY_SLUG.get(slug);
}

export function fundGroups(): Record<FundType | "shariah", Fund[]> {
  return {
    growth: ALL_FUNDS.filter((f) => f.type === "growth"),
    balanced: ALL_FUNDS.filter((f) => f.type === "balanced"),
    income: ALL_FUNDS.filter((f) => f.type === "income"),
    shariah: ALL_FUNDS.filter((f) => f.shariah),
  };
}

export const AMC_LIST: Array<{ slug: string; name: string; count: number }> = ds.amcs
  .map((a) => ({
    slug: a.id,
    name: a.shortName,
    count: ALL_FUNDS.filter((f) => f.amcId === a.id).length,
  }))
  .filter((a) => a.count > 0)
  .sort((a, b) => b.count - a.count);

/** Older pages used `AMCs`; keep one name while they are migrated. */
export const AMCs = AMC_LIST;

/**
 * Display counts are always computed from the committed data. No editorial
 * number is typed into a page.
 */
export const STATS = {
  funds: ALL_FUNDS.length,
  amcs: AMC_LIST.length,
  withNav: WITH_NAV_COUNT,
  complete: META.counts.complete,
  partial: META.counts.partial,
  missing: META.counts.missing,
  stale: META.counts.stale,
  shariah: SHARIAH_COUNT,
  verified: VERIFIED_COUNT,
  withSize: FUNDS_WITH_SIZE,
  totalSizeCr: FUNDS_WITH_SIZE ? TOTAL_AUM_CR : null,
  latestNavDate: META.latestNavDate,
  lastUpdated: META.lastUpdated,
} as const;

/* ── Benchmark views ──────────────────────────────────────────────────────── */

export interface Bench {
  slug: string;
  name: string;
  short: string;
  color: string;
  annualRate: number | null;
  status: "verified" | "approximate" | "unavailable";
  note: string;
  source: { name: string; url: string | null; asOf: string | null };
  /** Dated level series when one exists (e.g. the real DSEX closes). */
  series: BenchLevel[] | null;
}

export const BENCHES: Bench[] = ds.benchmarks.map((b) => ({
  slug: b.id,
  name: b.name,
  short: b.shortName,
  color: b.color,
  annualRate: b.annualRate,
  status: b.status,
  note: b.note,
  source: { name: b.source.name, url: b.source.url ?? null, asOf: b.source.asOf ?? null },
  series: (b.series as BenchLevel[] | null) ?? null,
}));

export const AVAILABLE_BENCHES = BENCHES.filter((b) => b.status !== "unavailable" && b.annualRate !== null);

export function benchBySlug(slug: string): Bench | undefined {
  return BENCHES.find((b) => b.slug === slug);
}

/* ── Metrics ──────────────────────────────────────────────────────────────── */

const METRICS = new Map<string, FundMetrics>();
const LUMP_PATHS = new Map<string, ValuePoint[]>();

/** Real DSEX month-end levels (from data/benchmarks.json) — the cited market series used for beta. */
const DSEX_LEVELS = (ds.benchmarks.find((b) => b.id === "dsex")?.series as BenchLevel[] | null) ?? null;

function seriesFor(fund: Fund) {
  return { nav: fund.nav, dividends: fund.dividends };
}

function returnOf(fund: Fund, years: number | null): PeriodReturn | null {
  return lumpSum(seriesFor(fund), 1, years, "reinvest")?.result ?? null;
}

function sipOf(fund: Fund, years: number | null): SipResult | null {
  return sipCalc(seriesFor(fund), 5000, years, "reinvest")?.result ?? null;
}

export function metricsFor(slug: string): FundMetrics {
  const hit = METRICS.get(slug);
  if (hit) return hit;
  const fund = getFund(slug);
  if (!fund) throw new Error(`Unknown fund: ${slug}`);
  const end = latestNav(fund.nav);
  if (!end) {
    const empty: FundMetrics = {
      latestNav: 0,
      latestNavDate: "",
      asOf: "",
      rows: 0,
      g1: null,
      g3: null,
      g5: null,
      gMax: null,
      returns: { "1y": null, "3y": null, "5y": null, max: null },
      worstFall: 0,
      drawdown: { value: 0, peakDate: null, troughDate: null },
      vol: null,
      beta: null,
      positiveMonths3y: null,
      sip: { irr1: null, irr3: null, irr5: null, final3: null, invested3: null, runs: {} },
      divPaid3y: 0,
      dividendCount3y: 0,
    };
    METRICS.set(slug, empty);
    return empty;
  }

  const r1 = returnOf(fund, 1);
  const r3 = returnOf(fund, 3);
  const r5 = returnOf(fund, 5);
  const rMax = returnOf(fund, null);
  const s1 = sipOf(fund, 1);
  const s3 = sipOf(fund, 3);
  const s5 = sipOf(fund, 5);
  const sMax = sipCalc(seriesFor(fund), 5000, null, "reinvest")?.result ?? null;
  const dd = maxDrawdown(fund.nav);
  const threeYearStart = addMonths(end.date, -36);

  const metrics: FundMetrics = {
    latestNav: end.nav,
    latestNavDate: end.date,
    asOf: end.date.slice(0, 7),
    rows: fund.nav.length,
    g1: r1?.cagr ?? null,
    g3: r3?.cagr ?? null,
    g5: r5?.cagr ?? null,
    gMax: rMax?.cagr ?? null,
    returns: { "1y": r1, "3y": r3, "5y": r5, max: rMax },
    worstFall: dd.value,
    drawdown: dd,
    vol: annualisedVolatility(fund.nav),
    beta: betaVsIndex(fund.nav, DSEX_LEVELS),
    positiveMonths3y: positiveMonths(fund.nav),
    sip: {
      irr1: s1?.xirr ?? null,
      irr3: s3?.xirr ?? null,
      irr5: s5?.xirr ?? null,
      final3: s3?.final ?? null,
      invested3: s3?.invested ?? null,
      runs: { "1y": s1, "3y": s3, "5y": s5, max: sMax },
    },
    divPaid3y: dividendsBetween(fund.dividends, threeYearStart, end.date),
    dividendCount3y: fund.dividends.filter((d) => d.recordDate > threeYearStart && d.recordDate <= end.date).length,
  };
  METRICS.set(slug, metrics);
  return metrics;
}

/** A fund only enters a ranking when it has a usable metric and is not stale. */
export function isRankable(fund: Fund, metric: "1y" | "3y" | "5y" | "max" = "3y"): boolean {
  if (fund.isStale || fund.completeness === "missing") return false;
  return metricsFor(fund.slug).returns[metric] !== null;
}

export function rankedFunds(metric: "1y" | "3y" | "5y" | "max" = "3y"): Fund[] {
  return ALL_FUNDS.filter((f) => isRankable(f, metric)).sort(
    (a, b) => (metricsFor(b.slug).returns[metric]?.cagr ?? -99) - (metricsFor(a.slug).returns[metric]?.cagr ?? -99)
  );
}

/* ── Chart paths ──────────────────────────────────────────────────────────── */

export function lumpPath(slug: string, amount: number, months: number | null): ValuePoint[] {
  const fund = getFund(slug);
  if (!fund) return [];
  const years = months === null ? null : months / 12;
  return lumpSum(seriesFor(fund), amount, years, "reinvest")?.path ?? [];
}

/**
 * Benchmark trail aligned to the fund's month-end series (per ৳1).
 * When the benchmark has a real dated series (DSEX/DSES) the actual index
 * levels are used — rescaled so ৳1 = the index level in the fund's first
 * covered month — and months the index doesn't cover are null. Otherwise a
 * flat annual rate compounds month by month.
 */
export function benchTrail(benchSlug: string, fund: Fund): Array<number | null> {
  const months = fund.series.map((p) => p.m);
  const b = BENCHES.find((x) => x.slug === benchSlug);
  if (!b) return months.map(() => null);
  if (b.series && b.series.length >= 2) return alignBenchTrail(months, b.series);
  if (b.annualRate === null || b.status === "unavailable") return months.map(() => null);
  const rM = Math.pow(1 + b.annualRate / 100, 1 / 12) - 1;
  let value = 1;
  return fund.series.map((p, i) => {
    if (i > 0) value *= 1 + rM;
    return value;
  });
}

/** Benchmark values in ৳, index-aligned to the fund's month-end series. */
export function benchValues(benchSlug: string, fund: Fund, amount: number): Array<number | null> {
  return benchTrail(benchSlug, fund).map((v) => (v === null ? null : v * amount));
}

/** First month key covered by a benchmark trail, if any. */
export function benchTrailStart(trail: Array<number | null>, fund: Fund): string | null {
  const i = trail.findIndex((v) => v !== null);
  return i === -1 ? null : fund.series[i]?.m ?? null;
}

/** SVG polyline path for a numeric series. */
export { linePath };

export function sparkPath(slug: string, w = 96, h = 30): string {
  const fund = getFund(slug);
  if (!fund) return "";
  return linePath(fund.series.slice(-36).map((p) => p.nav), w, h);
}

export function fundSparkPoints(slug: string): number[] {
  const fund = getFund(slug);
  return fund ? fund.series.slice(-36).map((p) => p.nav) : [];
}

/* ── Browser payload ─────────────────────────────────────────────────────── */

/** Compact, serialisable fund history for the client calculator. */
export function calculatorFunds() {
  return ALL_FUNDS.filter((f) => !f.isStale && f.completeness !== "missing").map((f) => ({
    id: f.id,
    slug: f.slug,
    name: f.name,
    acronym: f.acronym,
    amc: f.amc,
    type: f.type,
    shariah: f.shariah,
    fee: f.fee,
    fundSize: f.fundSize,
    launchDate: f.launchDate,
    latestNav: metricsFor(f.slug).latestNav,
    latestNavDate: f.latestNavDate ?? "",
    months: monthEndSeries(f.nav),
    dividends: f.dividends,
    completeness: f.completeness,
    isStale: f.isStale,
  }));
}

export { availableBenchmarks, addDays };
export type { ValuePoint };
