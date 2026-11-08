import type { NavPoint } from "@/lib/types";

/**
 * Shared market factor — DSEX-style monthly price path used to shape fund series.
 * Anchor story (approximate history, replaced when real index series is wired in):
 * Aug 2018 ≈ 6,100 → Mar 2020 COVID crash ≈ 4,400 → 2021 bull peak ≈ 7,200 →
 * 2022–23 grind down → Jul–Aug 2024 crash ≈ 5,000 → rebound into late 2026 ≈ 6,050.
 */
const DSEX_LEVELS: Array<[string, number]> = [
  ["2018-08", 6100], ["2018-09", 6050], ["2018-10", 6000], ["2018-11", 5920],
  ["2018-12", 5860], ["2019-01", 5900], ["2019-02", 5960], ["2019-03", 6010],
  ["2019-04", 6060], ["2019-05", 6010], ["2019-06", 5960], ["2019-07", 6000],
  ["2019-08", 6060], ["2019-09", 6120], ["2019-10", 6060], ["2019-11", 6100],
  ["2019-12", 6150], ["2020-01", 6100], ["2020-02", 6000], ["2020-03", 5000],
  ["2020-04", 4600], ["2020-05", 4700], ["2020-06", 4900], ["2020-07", 5150],
  ["2020-08", 5400], ["2020-09", 5500],
  ["2020-10", 5600], ["2020-11", 5720], ["2020-12", 5900],
  ["2021-01", 6050], ["2021-02", 6200], ["2021-03", 6350], ["2021-04", 6480],
  ["2021-05", 6600], ["2021-06", 6780], ["2021-07", 7000], ["2021-08", 7200],
  ["2021-09", 7050], ["2021-10", 6950], ["2021-11", 6900], ["2021-12", 6880],
  ["2022-01", 6950], ["2022-02", 6820], ["2022-03", 6700], ["2022-04", 6620],
  ["2022-05", 6550], ["2022-06", 6680], ["2022-07", 6500], ["2022-08", 6420],
  ["2022-09", 6350], ["2022-10", 6280], ["2022-11", 6220], ["2022-12", 6300],
  ["2023-01", 6250], ["2023-02", 6120], ["2023-03", 6050], ["2023-04", 5980],
  ["2023-05", 6020], ["2023-06", 5950], ["2023-07", 5900], ["2023-08", 5860],
  ["2023-09", 5900], ["2023-10", 5950], ["2023-11", 5980], ["2023-12", 6020],
  ["2024-01", 5950], ["2024-02", 5900], ["2024-03", 5850], ["2024-04", 5800],
  ["2024-05", 5760], ["2024-06", 5700], ["2024-07", 5300], ["2024-08", 5000],
  ["2024-09", 5450], ["2024-10", 5650], ["2024-11", 5750], ["2024-12", 5850],
  ["2025-01", 5720], ["2025-02", 5650], ["2025-03", 5580], ["2025-04", 5500],
  ["2025-05", 5560], ["2025-06", 5620], ["2025-07", 5700], ["2025-08", 5760],
  ["2025-09", 5830], ["2025-10", 5880], ["2025-11", 5820], ["2025-12", 5860],
  ["2026-01", 5780], ["2026-02", 5700], ["2026-03", 5620], ["2026-04", 5580],
  ["2026-05", 5650], ["2026-06", 5740], ["2026-07", 5850], ["2026-08", 5930],
  ["2026-09", 6000], ["2026-10", 6050],
];

export const MARKET_MONTHS = DSEX_LEVELS.map(([m]) => m);
export const MARKET_LOG_R: number[] = (() => {
  const out = [0];
  for (let i = 1; i < DSEX_LEVELS.length; i++) {
    out.push(Math.log(DSEX_LEVELS[i][1] / DSEX_LEVELS[i - 1][1]));
  }
  return out;
})();

/* ── Deterministic RNG (mulberry32), identical on server & client ─────────── */

function hashSeed(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
export { hashSeed };

export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function gauss(rng: () => number): number {
  let u = 0, v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

/* ── Series construction ──────────────────────────────────────────────────── */

export interface SeedAnchors {
  slug: string;
  inception: string;
  type: "growth" | "balanced" | "income";
  g3: number | null;
  gSince: number | null;
  worstFall: number | null;
  divAnnualPct: number;
  divMonths: number[];
}

export interface FundSeries {
  points: NavPoint[]; // ascending by month
}

const IDIO_VOL: Record<string, number> = { growth: 0.032, balanced: 0.025, income: 0.009 };

/** Reconstruct a monthly NAV + dividend series consistent with the published anchors. */
export function buildSeries(seed: SeedAnchors, dataWindowStart: string, asOf: string): FundSeries {
  const i0 = MARKET_MONTHS.indexOf(seed.inception > dataWindowStart ? seed.inception : dataWindowStart);
  const i1 = MARKET_MONTHS.indexOf(asOf);
  if (i0 < 0 || i1 < 0 || i0 >= i1) return { points: [] };

  const n = i1 - i0 + 1; // monthly points
  const rng = mulberry32(hashSeed(seed.slug));
  const idio = IDIO_VOL[seed.type] ?? 0.03;
  const noise: number[] = [0];
  for (let t = 1; t < n; t++) noise.push(gauss(rng) * idio);

  // ── Beta & drift ─────────────────────────────────────────────────────────────
  // Seed anchors are authored in percent (g3: 8.58 = 8.58%/yr; worstFall: -12.0 = -12%);
  // everything downstream of buildSeries works in fractions.
  // r varies monthly as alpha + beta·market + idio, then two calibrations force the
  // published anchors exactly (whole window → gSince, last 36 months → g3) for any
  // beta / idio scale — so anchor exactness never competes with shape fitting.
  const buildR = (beta: number, iscale: number): number[] => {
    const gTarget = Math.max(-25, Math.min(30, seed.gSince ?? 7)) / 100;
    const spanYears = (n - 1) / 12;
    const mktMean = mean(MARKET_LOG_R.slice(i0 + 1, i1 + 1));
    const totalLog = Math.log(1 + gTarget) * spanYears;
    const alpha = totalLog / (n - 1) - beta * mktMean;

    const r: number[] = [0];
    for (let t = 1; t < n; t++) r.push(alpha + beta * MARKET_LOG_R[i0 + t] + noise[t] * iscale);

    // Calibrate (1): whole tracked window → since-launch anchor (additive log shift).
    {
      let acc = 0;
      for (let t = 1; t < n; t++) acc += r[t];
      const delta = (totalLog - acc) / (n - 1);
      for (let t = 1; t < n; t++) r[t] += delta;
    }

    // Calibrate (2): the last 36 monthly returns → 3-year anchor exactly.
    if (seed.g3 !== null && n - 1 >= 36) {
      const k = 36;
      let acc2 = 0;
      for (let t = n - k; t < n; t++) acc2 += r[t];
      const delta2 = (Math.log(1 + seed.g3 / 100) * 3 - acc2) / k;
      for (let t = n - k; t < n; t++) r[t] += delta2;
    }
    return r;
  };

  const deepestDD = (rv: number[]): number => {
    let cum = 0, pk = 0, worst = 0;
    for (let t = 1; t < rv.length; t++) {
      cum += rv[t];
      if (cum > pk) pk = cum;
      const d = cum - pk;
      if (d < worst) worst = d;
    }
    return worst;
  };

  // ── Shaping pass: enforce the published worstFall drawdown ─────────────────
  // The worst retrenchment of the path is bent to match `worstFall` by
  // redistributing log-returns inside the deepest window and compensating
  // outside it — in a way that keeps BOTH anchor sums (whole window, last 36)
  // bit-exact, since every month-shift totals zero within each partition.
  const shapeDD = (rv: number[], logTarget: number): void => {
    for (let iter = 0; iter < 12; iter++) {
      const { k0, k1 } = drawdownWindow(rv);
      let ddNow = 0;
      for (let t = k0 + 1; t <= k1; t++) ddNow += rv[t];
      const D = logTarget - ddNow; // >0: trough must rise (shallower fall)
      if (Math.abs(D) < 0.002) break;
      const W = k1 - k0;
      const s = D / W;
      // dd-window months inside the last-36 slice: [kStart..n-1]
      const kStart = Math.max(0, rv.length - 36); // first index of last-36 range (rv[0] = launch month)
      // A = number of window shift-months inside last-36
      const a0 = Math.max(k0 + 1, kStart);
      let A = 0;
      for (let t = a0; t <= k1; t++) A++;
      // Feasibility: we must have non-window months in each partition that the
      // window shifted, or the anchors (last-36 / whole-window sums) would break.
      const compCount = 36 - A;
      const Wout = W - A;
      let bCount = 0;
      for (let t = 1; t < kStart; t++) if (t < k0 + 1 || t > k1) bCount++;
      if ((A > 0 && compCount === 0) || (Wout > 0 && bCount === 0)) break;
      for (let t = k0 + 1; t <= k1; t++) rv[t] += s;
      // offset inside last-36 (outside the window) so its sum stays exact
      if (A > 0) {
        const sB = (s * A) / compCount;
        for (let t = kStart; t < rv.length; t++) if (t < k0 + 1 || t > k1) rv[t] -= sB;
      }
      // offset outside last-36 for the window months that sit there
      if (Wout > 0) {
        const sC = (s * Wout) / bCount;
        for (let t = 1; t < kStart; t++) if (t < k0 + 1 || t > k1) rv[t] -= sC;
      }
    }
  };

  const logTarget = seed.worstFall === null ? null : Math.log(1 + seed.worstFall / 100);
  let r: number[];
  if (logTarget === null) {
    r = buildR(0.5, 1);
  } else {
    const mLog = windowMaxDrawdown(MARKET_LOG_R, i0, i1); // negative
    let beta = 0.5;
    if (mLog < 0) {
      // Pass 0: scale by the market's own tracked-window drawdown, then two damped
      // refinements that subtract the fund's own drift+noise drawdown measured on
      // the actual worst window (the shaping pass handles the final exactness).
      let cur = Math.min(1.35, Math.max(0.05, logTarget / mLog));
      for (let pass = 0; pass < 2; pass++) {
        const rr = buildR(cur, 1);
        const { k0, k1 } = drawdownWindow(rr);
        let resid = 0, mktDD = 0;
        for (let t = k0 + 1; t <= k1; t++) {
          resid += rr[t] - cur * MARKET_LOG_R[i0 + t];
          mktDD += MARKET_LOG_R[i0 + t];
        }
        if (mktDD >= -0.05) break; // window mostly idio — beta refinement can't help
        cur = Math.min(1.35, Math.max(0.05, cur + 0.8 * ((logTarget - resid) / mktDD - cur)));
      }
      beta = cur;
    }
    // Shape at full noise amplitude first; long-window monstrosities that no window
    // shaping alone can fix converge once the idio noise contributes less, so try a
    // quieter market too and keep whichever lands nearest the published drawdown.
    let best: { r: number[]; err: number } | null = null;
    for (const iscale of [1, 0.5, 0.25]) {
      const rr = buildR(beta, iscale);
      shapeDD(rr, logTarget);
      const err = Math.abs(deepestDD(rr) - logTarget);
      if (!best || err < best.err) best = { r: rr, err };
      if (err < 0.004) break;
    }
    r = best ? best.r : buildR(0.5, 1);
  }

  // Total-return index path.
  const TR: number[] = [1];
  for (let t = 1; t < n; t++) TR.push(TR[t - 1] * Math.exp(r[t]));

  // Split total return into price NAV + cash dividends. Convention: on a dividend
  // month with event rate d, cash per unit = prevNav·d and ex-NAV = prevNav·(1+r)/(1+d),
  // so reinvesting exactly reproduces the total-return path.
  const rng2 = mulberry32(hashSeed(seed.slug + ":nav0"));
  const totalNav0 = Number((8.6 + rng2() * 6.5).toFixed(2));
  const divRateEvent = seed.divMonths.length > 0 ? seed.divAnnualPct / 100 / seed.divMonths.length : 0;
  const points: NavPoint[] = [];
  let nav = totalNav0;
  for (let t = 0; t < n; t++) {
    const m = MARKET_MONTHS[i0 + t];
    const isDiv = divRateEvent > 0 && seed.divMonths.includes(Number(m.split("-")[1])) && t > 0;
    const perUnit = isDiv ? nav * divRateEvent : 0;
    if (t > 0) {
      const ratio = TR[t] / TR[t - 1];
      nav = isDiv ? (nav * ratio) / (1 + divRateEvent) : nav * ratio;
    }
    points.push({ m, nav: Number(nav.toFixed(2)), div: Number(perUnit.toFixed(3)) });
  }
  return { points };
}

function windowMaxDrawdown(logR: number[], i0: number, i1: number): number {
  let cum = 0, peak = 0, worst = 0;
  for (let i = i0 + 1; i <= i1; i++) {
    cum += logR[i];
    if (cum > peak) peak = cum;
    const dd = cum - peak;
    if (dd < worst) worst = dd;
  }
  return worst;
}

/** Span (peak index, trough index) of the deepest drawdown of a cumulative log-return path. */
function drawdownWindow(r: number[]): { k0: number; k1: number } {
  let cum = 0, peakIdx = 0, peak = 0;
  let worst = 0, w0 = 0, w1 = 0;
  for (let t = 1; t < r.length; t++) {
    cum += r[t];
    if (cum > peak) { peak = cum; peakIdx = t; }
    const dd = cum - peak;
    if (dd < worst) { worst = dd; w0 = peakIdx; w1 = t; }
  }
  return { k0: w0, k1: w1 };
}

function mean(xs: number[]): number {
  if (!xs.length) return 0;
  let s = 0;
  for (const x of xs) s += x;
  return s / xs.length;
}
