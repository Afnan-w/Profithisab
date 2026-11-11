import type { DividendMode, DividendRow, Drawdown, NavRow, PeriodReturn, SipResult } from "@/lib/types";
import { addDays, addMonths, daysBetween } from "@/lib/date";

/**
 * Pure return arithmetic. No React, no filesystem, no randomness.
 *
 * Total return = NAV movement + dividends. Dividends are either reinvested at
 * the first published NAV on/after the record date (default) or kept as cash.
 */

export interface FundSeries {
  nav: NavRow[];
  dividends: DividendRow[];
}

export interface ValuePoint {
  date: string;
  value: number;
}

export interface RunResult<T> {
  result: T;
  path: ValuePoint[];
}

const MIN_ANNUALIZED_DAYS = 90;

/** First NAV row on or after `date` (binary search; rows must be ascending). */
export function navOnOrAfter(nav: NavRow[], date: string): NavRow | null {
  if (!nav.length) return null;
  let lo = 0;
  let hi = nav.length - 1;
  let ans = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (nav[mid].date >= date) {
      ans = mid;
      hi = mid - 1;
    } else {
      lo = mid + 1;
    }
  }
  return ans === -1 ? null : nav[ans];
}

/** Last NAV row on or before `date`. */
export function navOnOrBefore(nav: NavRow[], date: string): NavRow | null {
  if (!nav.length) return null;
  let lo = 0;
  let hi = nav.length - 1;
  let ans = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (nav[mid].date <= date) {
      ans = mid;
      lo = mid + 1;
    } else {
      hi = mid - 1;
    }
  }
  return ans === -1 ? null : nav[ans];
}

export function latestNav(nav: NavRow[]): NavRow | null {
  return nav.length ? nav[nav.length - 1] : null;
}

/** Last observation in each calendar month. */
export function monthEndSeries(nav: NavRow[]): NavRow[] {
  const out: NavRow[] = [];
  for (const row of nav) {
    const key = row.date.slice(0, 7);
    const prev = out[out.length - 1];
    if (prev && prev.date.slice(0, 7) === key) out[out.length - 1] = row;
    else out.push(row);
  }
  return out;
}

/** Months of history available, rounded down. */
export function monthsAvailable(nav: NavRow[]): number {
  if (nav.length < 2) return 0;
  const a = nav[0].date;
  const b = nav[nav.length - 1].date;
  return Math.max(0, Math.floor((daysBetween(a, b) / 365.25) * 12));
}

export function cagrFrom(growth: number, days: number): number | null {
  if (!isFinite(growth) || growth <= 0 || days <= 0) return null;
  return Math.pow(growth, 365 / days) - 1;
}

function periodReturn(startRow: NavRow, endRow: NavRow, finalValue: number, amount: number): PeriodReturn | null {
  const days = daysBetween(startRow.date, endRow.date);
  if (days < MIN_ANNUALIZED_DAYS) return null;
  const growth = finalValue / amount;
  const cagr = cagrFrom(growth, days);
  if (cagr === null) return null;
  return { cagr, startDate: startRow.date, endDate: endRow.date, days, growth };
}

/** Effective reinvestment NAV date/price for a dividend. */
function dividendNav(dividends: DividendRow, nav: NavRow[], date: string): { row: NavRow; amount: number } | null {
  if (dividends.navAtRecordDate && dividends.navAtRecordDate > 0) {
    const row = navOnOrAfter(nav, dividends.recordDate);
    if (!row) return null;
    return { row, amount: dividends.navAtRecordDate };
  }
  const row = navOnOrAfter(nav, dividends.recordDate);
  if (!row) return null;
  void date;
  return { row, amount: row.nav };
}

interface DividendEvent {
  date: string; // effective reinvestment date
  recordDate: string;
  amount: number;
  nav: number;
}

export function dividendEvents(series: FundSeries, afterDate: string, throughDate: string): DividendEvent[] {
  const out: DividendEvent[] = [];
  for (const d of series.dividends) {
    if (d.recordDate <= afterDate || d.recordDate > throughDate) continue;
    const found = dividendNav(d, series.nav, afterDate);
    if (!found) continue;
    if (found.row.date > throughDate) continue;
    out.push({ date: found.row.date, recordDate: d.recordDate, amount: d.amount, nav: found.amount });
  }
  return out.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

/* ── Lump sum ─────────────────────────────────────────────────────────────── */

export function lumpSum(
  series: FundSeries,
  amount: number,
  years: number | null,
  mode: DividendMode = "reinvest"
): RunResult<PeriodReturn> | null {
  if (amount <= 0 || series.nav.length < 2) return null;
  const end = series.nav[series.nav.length - 1];
  const target = years === null ? series.nav[0].date : addMonths(end.date, -12 * years);
  const start = navOnOrAfter(series.nav, target);
  if (!start) return null;
  // If the fund's first NAV is much later than the requested start, it lacks the history.
  if (years !== null && daysBetween(target, start.date) > 31) return null;
  if (daysBetween(start.date, end.date) < MIN_ANNUALIZED_DAYS) return null;

  const events = dividendEvents(series, start.date, end.date);
  let units = amount / start.nav;
  let cash = 0;
  let eventIdx = 0;

  const applyEventsThrough = (date: string) => {
    while (eventIdx < events.length && events[eventIdx].date <= date) {
      const ev = events[eventIdx];
      if (mode === "reinvest") units += (units * ev.amount) / ev.nav;
      else cash += units * ev.amount;
      eventIdx += 1;
    }
  };

  const path: ValuePoint[] = [];
  const monthly = monthEndSeries(series.nav);
  for (const row of monthly) {
    if (row.date < start.date) continue;
    applyEventsThrough(row.date);
    path.push({ date: row.date, value: units * row.nav + cash });
  }
  applyEventsThrough(end.date);
  const finalValue = units * end.nav + cash;
  const result = periodReturn(start, end, finalValue, amount);
  if (!result) return null;
  // Ensure the final point is exact even if the last month-end trim differs.
  if (path.length) path[path.length - 1] = { date: end.date, value: finalValue };
  return { result, path };
}

/* ── SIP ──────────────────────────────────────────────────────────────────── */

export function sipRun(
  series: FundSeries,
  perMonth: number,
  years: number | null,
  mode: DividendMode = "reinvest"
): RunResult<SipResult> | null {
  if (perMonth <= 0 || series.nav.length < 2) return null;
  const end = series.nav[series.nav.length - 1];
  const months = years === null ? monthsAvailable(series.nav) : years * 12;
  if (months < 12) return null;

  const targets: string[] = [];
  for (let k = months; k >= 1; k--) targets.push(addMonths(end.date, -k));

  const purchases: NavRow[] = [];
  for (const target of targets) {
    const row = navOnOrAfter(series.nav, target);
    if (!row || row.date > end.date) return null;
    if (daysBetween(target, row.date) > 31) return null;
    purchases.push(row);
  }
  if (!purchases.length) return null;

  const first = purchases[0];
  const events = dividendEvents(series, first.date, end.date);

  let units = 0;
  let cash = 0;
  let eventIdx = 0;
  let purchaseIdx = 0;
  const flows: Array<{ date: string; amount: number }> = [];

  const applyEventsBefore = (date: string) => {
    // Dividends on the same day are applied before that day's purchase (conservative).
    while (eventIdx < events.length && events[eventIdx].date < date) {
      const ev = events[eventIdx];
      if (mode === "reinvest") units += (units * ev.amount) / ev.nav;
      else cash += units * ev.amount;
      eventIdx += 1;
    }
  };

  const monthly = monthEndSeries(series.nav);
  const path: ValuePoint[] = [];
  for (const row of monthly) {
    if (row.date < first.date) continue;
    applyEventsBefore(row.date);
    while (purchaseIdx < purchases.length && purchases[purchaseIdx].date <= row.date) {
      const p = purchases[purchaseIdx];
      applyEventsBefore(p.date);
      units += perMonth / p.nav;
      flows.push({ date: p.date, amount: -perMonth });
      purchaseIdx += 1;
    }
    // Dividends dated exactly on this valuation day.
    while (eventIdx < events.length && events[eventIdx].date <= row.date) {
      const ev = events[eventIdx];
      if (mode === "reinvest") units += (units * ev.amount) / ev.nav;
      else cash += units * ev.amount;
      eventIdx += 1;
    }
    path.push({ date: row.date, value: units * row.nav + cash });
  }

  // Any purchases after the last month-end (possible for daily data) are still valid.
  while (purchaseIdx < purchases.length) {
    const p = purchases[purchaseIdx];
    applyEventsBefore(p.date);
    units += perMonth / p.nav;
    flows.push({ date: p.date, amount: -perMonth });
    purchaseIdx += 1;
  }
  while (eventIdx < events.length) {
    const ev = events[eventIdx];
    if (mode === "reinvest") units += (units * ev.amount) / ev.nav;
    else cash += units * ev.amount;
    eventIdx += 1;
  }

  const finalValue = units * end.nav + cash;
  flows.push({ date: end.date, amount: finalValue });
  const rate = xirr(flows);
  if (rate === null) return null;

  const result: SipResult = {
    xirr: rate,
    final: finalValue,
    invested: perMonth * months,
    months,
    startDate: first.date,
    endDate: end.date,
  };
  if (path.length) path[path.length - 1] = { date: end.date, value: finalValue };
  return { result, path };
}

/* ── XIRR ─────────────────────────────────────────────────────────────────── */

export function xirr(flows: Array<{ date: string; amount: number }>): number | null {
  if (flows.length < 2) return null;
  const sorted = [...flows].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  if (!sorted.some((f) => f.amount > 0) || !sorted.some((f) => f.amount < 0)) return null;
  const base = sorted[0].date;
  const npv = (rate: number) => {
    let sum = 0;
    for (const f of sorted) {
      const t = daysBetween(base, f.date) / 365;
      sum += f.amount / Math.pow(1 + rate, t);
    }
    return sum;
  };

  let lo = -0.9999;
  let hi = 1;
  let fLo = npv(lo);
  let fHi = npv(hi);
  let guard = 0;
  while (fLo * fHi > 0 && hi < 1e6 && guard < 100) {
    hi *= 2;
    fHi = npv(hi);
    guard += 1;
  }
  if (fLo * fHi > 0) return null;
  for (let i = 0; i < 200; i++) {
    const mid = (lo + hi) / 2;
    const fMid = npv(mid);
    if (Math.abs(fMid) < 1e-9) return mid;
    if (fLo * fMid <= 0) {
      hi = mid;
      fHi = fMid;
    } else {
      lo = mid;
      fLo = fMid;
    }
  }
  return (lo + hi) / 2;
}

/* ── Risk ─────────────────────────────────────────────────────────────────── */

export function maxDrawdown(nav: NavRow[]): Drawdown {
  if (!nav.length) return { value: 0, peakDate: null, troughDate: null };
  let peak = nav[0];
  let worst = 0;
  let peakAtWorst = nav[0];
  let troughAtWorst = nav[0];
  for (const row of nav) {
    if (row.nav > peak.nav) peak = row;
    const dd = row.nav / peak.nav - 1;
    if (dd < worst) {
      worst = dd;
      peakAtWorst = peak;
      troughAtWorst = row;
    }
  }
  return { value: worst, peakDate: peakAtWorst.date, troughDate: troughAtWorst.date };
}

/** Annualised volatility from month-end NAV log-returns (last `months`). */
export function annualisedVolatility(nav: NavRow[], months = 36): number | null {
  const monthly = monthEndSeries(nav);
  if (monthly.length < 13) return null;
  const slice = monthly.slice(-(months + 1));
  const rets: number[] = [];
  for (let i = 1; i < slice.length; i++) {
    if (slice[i - 1].nav > 0 && slice[i].nav > 0) rets.push(Math.log(slice[i].nav / slice[i - 1].nav));
  }
  if (rets.length < 6) return null;
  const mean = rets.reduce((a, b) => a + b, 0) / rets.length;
  const variance = rets.reduce((a, r) => a + (r - mean) * (r - mean), 0) / rets.length;
  return Math.sqrt(variance) * Math.sqrt(12);
}

/** Share of months in the trailing window where the NAV rose or held. */
export function positiveMonths(nav: NavRow[], months = 36): number | null {
  const monthly = monthEndSeries(nav);
  if (monthly.length < 13) return null;
  const slice = monthly.slice(-(months + 1));
  let pos = 0;
  for (let i = 1; i < slice.length; i++) if (slice[i].nav >= slice[i - 1].nav) pos += 1;
  return pos / (slice.length - 1);
}

/** Total cash dividends per unit between two dates. */
export function dividendsBetween(dividends: DividendRow[], from: string, to: string): number {
  return dividends
    .filter((d) => d.recordDate > from && d.recordDate <= to)
    .reduce((sum, d) => sum + d.amount, 0);
}

/**
 * Guard used by import + publish rules: a one-step NAV move over 15% is
 * suspicious for an open-end fund and goes to review instead of the site.
 */
export function suspiciousJump(prev: NavRow, next: NavRow, threshold = 0.15): boolean {
  if (!prev || !next || prev.nav <= 0) return false;
  return Math.abs(next.nav / prev.nav - 1) > threshold;
}

export { MIN_ANNUALIZED_DAYS };
export { addDays };
