/** Formatting helpers — Bangladeshi ৳ conventions (lakh / crore, 1,00,000-style grouping). */

import { dayDate, longDate as longDateBase, monthLabel as monthLabelBase } from "@/lib/date";

const nf0 = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

export const NOT_AVAILABLE = "Data not available";
export const NOT_ENOUGH_HISTORY = "Not enough history";

export function formatIn(n: number): string {
  return nf0.format(Math.round(n));
}

function trimNum(x: number, digits: number): string {
  return `${Number(x.toFixed(digits))}`;
}

/** ৳ with lakh/crore words above one lakh. e.g. "৳1.24 crore", "৳3.4 lakh", "৳96,500". */
export function taka(n: number | null | undefined, opts?: { withWords?: boolean; tight?: boolean }): string {
  if (n === null || n === undefined || !isFinite(n)) return NOT_AVAILABLE;
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  if (abs >= 1e7) {
    const num = trimNum(abs / 1e7, 2);
    return opts?.tight ? `${sign}৳${num}cr` : `${sign}৳${num} crore`;
  }
  if (abs >= 1e5 && opts?.withWords !== false) {
    const num = trimNum(abs / 1e5, 2);
    return opts?.tight ? `${sign}৳${num}L` : `${sign}৳${num} lakh`;
  }
  return `${sign}৳${formatIn(abs)}`;
}

/** "৳1,00,000" exact Indian-style grouping, no lakh/crore words. */
export function takaExact(n: number | null | undefined): string {
  if (n === null || n === undefined || !isFinite(n)) return NOT_AVAILABLE;
  const sign = n < 0 ? "-" : "";
  return `${sign}৳${formatIn(Math.abs(n))}`;
}

/** Crore stat line, e.g. "৳33 cr". */
export function cr(n: number | null | undefined): string {
  if (n === null || n === undefined || !isFinite(n)) return NOT_AVAILABLE;
  if (n >= 1000) return `৳${trimNum(n / 1000, 2)}k cr`;
  return `৳${trimNum(n, n < 10 ? 2 : n < 100 ? 1 : 0)} cr`;
}

export function pct(x: number | null | undefined, opts?: { signed?: boolean; digits?: number }): string {
  if (x === null || x === undefined || !isFinite(x)) return NOT_AVAILABLE;
  const digits = opts?.digits ?? 1;
  const v = x * 100;
  const signCh = v < 0 ? "-" : opts?.signed === false ? "" : "+";
  return `${signCh}${Math.abs(v).toFixed(digits)}%`;
}

/** Percent value that is already in percentage points (11.28 → "11.3%"). */
export function pctPlain(x: number | null | undefined, digits = 1): string {
  if (x === null || x === undefined || !isFinite(x)) return NOT_AVAILABLE;
  return `${x.toFixed(digits)}%`;
}

export function longDate(iso: string | null | undefined): string {
  if (!iso) return NOT_AVAILABLE;
  return longDateBase(iso);
}

/** "2026-10" → "Oct '26" (chart axis labels). */
export function monthLabel(iso: string | null | undefined): string {
  if (!iso) return "";
  return monthLabelBase(iso);
}

export function fullDate(iso: string | null | undefined): string {
  if (!iso) return NOT_AVAILABLE;
  return dayDate(iso);
}

export function numIn(x: number, digits = 0): string {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: digits }).format(x);
}

const BN_DIGITS = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];

/** Convert any Latin digits in a formatted string to Bangla numerals. */
export function bnDigits(value: string): string {
  return value.replace(/\d/g, (d) => BN_DIGITS[Number(d)]);
}

export function maybeBn(value: string, bangla: boolean): string {
  return bangla ? bnDigits(value) : value;
}
