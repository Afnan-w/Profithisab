import type { Fund, FundSeed, FundMetrics, NavPoint } from "@/lib/types";
import { FUNDS, DATA_WINDOW_START } from "@/data/funds";
import { buildSeries, MARKET_MONTHS, MARKET_LOG_R } from "@/lib/engine";
import { BENCHES, type BenchSlug } from "@/lib/benchmarks";

/* ── Data access ─────────────────────────────────────────────────────────── */

export const ALL_FUNDS: Fund[] = FUNDS.map((s) => ({
  slug: s.slug,
  name: s.name,
  acronym: s.acronym,
  amc: s.amc,
  amcSlug: s.amcSlug,
  type: s.type,
  shariah: s.shariah,
  verified: s.verified,
  inception: s.inception,
  fee: s.fee,
  aumCr: s.aumCr,
  minTaka: s.minTaka ?? 5000,
  series: buildSeries(s, DATA_WINDOW_START, "2026-10").points,
}));

const BY_SLUG = new Map(ALL_FUNDS.map((f) => [f.slug, f]));

export function getFund(slug: string): Fund | undefined {
  return BY_SLUG.get(slug);
}

export function fundSeed(slug: string): FundSeed | undefined {
  return FUNDS.find((f) => f.slug === slug);
}

export const fundGroups = {
  growth: ALL_FUNDS.filter((f) => f.type === "growth"),
  balanced: ALL_FUNDS.filter((f) => f.type === "balanced"),
  income: ALL_FUNDS.filter((f) => f.type === "income"),
  shariah: ALL_FUNDS.filter((f) => f.shariah),
};

export const AMCs: Array<{ slug: string; name: string; count: number }> = (() => {
  const map = new Map<string, { name: string; count: number }>();
  for (const f of ALL_FUNDS) {
    const e = map.get(f.amcSlug) ?? { name: f.amc, count: 0 };
    e.count += 1;
    map.set(f.amcSlug, e);
  }
  return [...map.entries()]
    .map(([slug, v]) => ({ slug, name: v.name, count: v.count }))
    .sort((a, b) => b.count - a.count);
})();

export const TOTAL_AUM_CR = ALL_FUNDS.reduce((a, f) => a + f.aumCr, 0);
export const VERIFIED_COUNT = ALL_FUNDS.filter((f) => f.verified).length;

/* ── Return math (total return = NAV + dividends reinvested) ─────────────── */

export interface TRPoint {
  m: string;
  /** Value of the base amount at this month. */
  v: number;
}

/** Value path for ৳1 invested at index `startIdx`, dividends reinvested. */
function trFrom(series: NavPoint[], startIdx: number, base = 1): TRPoint[] {
  let units = base / series[startIdx].nav;
  const out: TRPoint[] = [];
  for (let i = startIdx; i < series.length; i++) {
    const p = series[i];
    if (i > startIdx && p.div > 0) units += units * (p.div / p.nav);
    out.push({ m: p.m, v: units * p.nav });
  }
  return out;
}

export function windowCagrPath(tr: TRPoint[], months: number): number | null {
  if (tr.length < months + 1 || months < 1) return null;
  const start = tr[tr.length - 1 - months].v;
  const end = tr[tr.length - 1].v;
  return Math.pow(end / start, 12 / months) - 1;
}

export function maxDrawdown(series: NavPoint[]): number {
  let peak = series[0]?.nav ?? 0;
  let worst = 0;
  for (const p of series) {
    if (p.nav > peak) peak = p.nav;
    const dd = p.nav / peak - 1;
    if (dd < worst) worst = dd;
  }
  return worst;
}

/** Monthly SIP over `months` months at the given per-month amount. */
export function sipRun(fund: Fund, perMonth: number, months: number) {
  const s = fund.series;
  const n = s.length;
  if (n < months) return null;
  let units = 0;
  const values: TRPoint[] = [];
  const first = n - months; // invest at month-ends s[first..n-2], value at n-1
  for (let i = 0; i < months; i++) {
    const k = first + i;
    const p = s[k];
    units += perMonth / p.nav;
    if (i > 0 && p.div > 0) units += units * (p.div / p.nav);
    const navVal = i === months - 1 ? s[n - 1].nav : s[k].nav;
    values.push({ m: p.m, v: units * navVal });
  }
  const invested = perMonth * months;
  const final = values[values.length - 1].v;
  const irrMonthly = solveIrr(perMonth, final, months);
  return {
    invested,
    final,
    values,
    irr: irrMonthly === null ? null : Math.pow(1 + irrMonthly, 12) - 1,
  };
}

/** IRR of -A at t=0..months-1 and +V at t=months-1 (monthly), via bisection. */
function solveIrr(a: number, v: number, months: number): number | null {
  const f = (r: number) => {
    let npv = 0;
    for (let t = 0; t < months; t++) npv -= a / Math.pow(1 + r, t);
    npv += v / Math.pow(1 + r, months - 1);
    return npv;
  };
  let lo = -0.03, hi = 0.05;
  if (f(lo) * f(hi) > 0) return null;
  for (let i = 0; i < 80; i++) {
    const mid = (lo + hi) / 2;
    if (f(lo) * f(mid) <= 0) hi = mid;
    else lo = mid;
  }
  return (lo + hi) / 2;
}

/* ── Per-fund metric cache ───────────────────────────────────────────────── */

interface Payload {
  tr: TRPoint[]; // full-window per-৳1 total-return path
  metrics: FundMetrics;
}
const CACHE = new Map<string, Payload>();

export function metricsFor(slug: string): FundMetrics {
  return payloadFor(slug).metrics;
}

export function payloadFor(slug: string): Payload {
  const hit = CACHE.get(slug);
  if (hit) return hit;
  const fund = getFund(slug);
  if (!fund) throw new Error(`Unknown fund ${slug}`);
  const s = fund.series;
  const n = s.length;
  const tr = trFrom(s, 0);

  let beta = 0;
  let vol = 0;
  if (n > 25) {
    const rets: number[] = [];
    const mkt: number[] = [];
    for (let i = Math.max(1, n - 36); i < n; i++) {
      rets.push(Math.log(s[i].nav / s[i - 1].nav));
      const mi = MARKET_MONTHS.indexOf(s[i].m);
      mkt.push(mi > 0 ? MARKET_LOG_R[mi] : 0);
    }
    const mm = mean(mkt), rm = mean(rets);
    let cov = 0, varm = 0;
    for (let i = 0; i < rets.length; i++) {
      cov += (mkt[i] - mm) * (rets[i] - rm);
      varm += (mkt[i] - mm) * (mkt[i] - mm);
    }
    beta = varm > 0 ? cov / varm : 0;
    let acc = 0;
    for (const r of rets) acc += Math.pow(r - rm, 2);
    vol = Math.sqrt(acc / rets.length) * Math.sqrt(12);
  }

  let positiveMonths3y: number | null = null;
  if (n > 37) {
    let pos = 0, tot = 0;
    for (let i = n - 36; i < n; i++) if (s[i].nav >= s[i - 1].nav) pos += 1;
    positiveMonths3y = pos / 36;
  }

  const sip3 = sipRun(fund, 5000, 36);

  let divPaid3y = 0;
  for (let i = Math.max(1, n - 36); i < n; i++) divPaid3y += s[i].div;

  const tr3 = s.length > 37;

  // worstFall is a published fact: when the catalog anchors it, trust the anchor
  // exactly (the reconstructed NAV series merely approximates its shape). Fall
  // back to the series' own max drawdown when the catalog doesn't state one.
  const seedFall = fundSeed(slug)?.worstFall ?? null;

  const metrics: FundMetrics = {
    asOf: s[n - 1].m,
    latestNav: s[n - 1].nav,
    months: n,
    g1: n > 13 ? windowCagrPath(tr, 12) : null,
    g3: n > 37 ? windowCagrPath(tr, 36) : null,
    g5: n > 61 ? windowCagrPath(tr, 60) : null,
    gMax: n > 13 ? windowCagrPath(tr, n - 1) : null,
    worstFall: seedFall !== null ? seedFall / 100 : n > 2 ? maxDrawdown(s) : 0,
    vol,
    beta,
    positiveMonths3y,
    sip: { irr3: sip3?.irr ?? null, final3: sip3?.final ?? null },
    divPaid3y: tr3 ? divPaid3y : 0,
  };
  CACHE.set(slug, { tr, metrics });
  return CACHE.get(slug)!;
}

/** Value path of `amount` invested `months` ago (0 = launch), reinvested. */
export function lumpPath(slug: string, amount: number, months: number): TRPoint[] {
  const fund = getFund(slug);
  if (!fund) return [];
  const tr = lumpPathCache(slug) ?? lumpPathBuild(fund);
  const n = tr.length;
  const start = Math.max(0, n - 1 - months);
  const base = tr[start].v;
  return tr.slice(start).map((p) => ({ m: p.m, v: (p.v / base) * amount }));
}

const LUMP_CACHE = new Map<string, TRPoint[]>();
function lumpPathBuild(fund: Fund): TRPoint[] {
  let units = 1 / fund.series[0].nav;
  const out: TRPoint[] = [];
  for (let i = 0; i < fund.series.length; i++) {
    const p = fund.series[i];
    if (i > 0 && p.div > 0) units += units * (p.div / p.nav);
    out.push({ m: p.m, v: units * p.nav });
  }
  LUMP_CACHE.set(fund.slug, out);
  return out;
}
function lumpPathCache(slug: string): TRPoint[] | null {
  return LUMP_CACHE.get(slug) ?? null;
}

/* ── Chart helpers ───────────────────────────────────────────────────────── */

/** SVG polyline path for a numeric series. */
export function linePath(values: number[], w: number, h: number): string {
  if (values.length < 2) return "";
  const min = Math.min(...values);
  const max = Math.max(...values);
  const pad = 2;
  const span = max - min || 1;
  const step = (w - pad * 2) / (values.length - 1);
  let d = "";
  for (let i = 0; i < values.length; i++) {
    const x = (pad + i * step).toFixed(1);
    const y = (h - pad - ((values[i] - min) / span) * (h - pad * 2)).toFixed(1);
    d += `${i === 0 ? "M" : "L"}${x} ${y} `;
  }
  return d.trim();
}

export function sparkPath(slug: string, w = 96, h = 30): string {
  const fund = getFund(slug);
  if (!fund) return "";
  return linePath(fund.series.slice(-36).map((p) => p.nav), w, h);
}

export function fundSparkPoints(slug: string): number[] {
  const fund = getFund(slug);
  return fund ? fund.series.slice(-36).map((p) => p.nav) : [];
}

/* ── Benchmark trails (per-৳1, aligned to fund series months) ─────────────── */

import { benchMonthlyLog } from "@/lib/benchmarks";

export function benchTrail(slug: BenchSlug, fund: Fund): TRPoint[] {
  if (slug === "dsex") {
    const out: TRPoint[] = [];
    let v = 1;
    for (let i = 0; i < fund.series.length; i++) {
      if (i > 0) {
        const mi = MARKET_MONTHS.indexOf(fund.series[i].m);
        v *= Math.exp(mi > 0 ? MARKET_LOG_R[mi] : 0);
      }
      out.push({ m: fund.series[i].m, v });
    }
    return out;
  }
  const out: TRPoint[] = [];
  let v = 1;
  for (let i = 0; i < fund.series.length; i++) {
    if (i > 0) v *= Math.exp(benchMonthlyLog(slug, MARKET_MONTHS.indexOf(fund.series[i].m), MARKET_MONTHS));
    out.push({ m: fund.series[i].m, v });
  }
  return out;
}

export { BENCHES };

function mean(xs: number[]): number {
  if (!xs.length) return 0;
  return xs.reduce((a, b) => a + b, 0) / xs.length;
}
