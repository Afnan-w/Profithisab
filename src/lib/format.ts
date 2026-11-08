/** Formatting helpers — Bangladeshi ৳ conventions (lakh / crore, 1,00,000-style grouping). */

const nf0 = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });

export function formatIn(n: number): string {
  return nf0.format(Math.round(n));
}

function trimNum(x: number, digits: number): string {
  const v = Number(x.toFixed(digits));
  return `${v}`;
}

/** ৳ with lakh/crore words above one lakh. e.g. "৳1.24 crore", "৳3.4 lakh", "৳96,500".
 *  `tight` gives axis-style compact labels: "৳1.24cr", "৳3.4L". */
export function taka(n: number, opts?: { withWords?: boolean; tight?: boolean }): string {
  const abs = Math.abs(n);
  const sign = n < 0 ? "-" : "";
  const a = Math.abs(n);
  if (a >= 1e7) {
    const num = trimNum(a / 1e7, 2);
    return opts?.tight ? `${sign}৳${num}cr` : `${sign}৳${num} crore`;
  }
  if (a >= 1e5 && opts?.withWords !== false) {
    const num = trimNum(a / 1e5, 2);
    return opts?.tight ? `${sign}৳${num}L` : `${sign}৳${num} lakh`;
  }
  return `${sign}৳${formatIn(a)}`;
}

/** "৳1,00,000" exact Indian-style grouping, no lakh/crore words. */
export function takaExact(n: number): string {
  const sign = n < 0 ? "-" : "";
  return `${sign}৳${formatIn(Math.abs(n))}`;
}

/** Crore stat line, e.g. "৳33 cr". */
export function cr(n: number): string {
  if (n >= 1000) return `৳${trimNum(n / 1000, 2)}k cr`;
  return `৳${trimNum(n, n < 10 ? 2 : n < 100 ? 1 : 0)} cr`;
}

export function pct(x: number | null | undefined, opts?: { signed?: boolean; digits?: number }): string {
  if (x === null || x === undefined || !isFinite(x)) return "—";
  const digits = opts?.digits ?? 1;
  const v = x * 100; // input is a fraction (0.14 → +14.0%)
  const signCh = v < 0 ? "-" : opts?.signed === false ? "" : "+";
  return `${signCh}${Math.abs(v).toFixed(digits)}%`;
}

export function pctPlain(x: number, digits = 1): string {
  return `${x.toFixed(digits)}%`;
}

/** Compact month label: "2026-10" → "Oct '26". */
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export function monthLabel(iso: string): string {
  const [y, m] = iso.split("-");
  return `${MONTHS[Number(m) - 1]} '${y.slice(2)}`;
}

export function longDate(iso: string): string {
  const [y, m] = iso.split("-");
  return `${MONTHS[Number(m) - 1]} ${y}`;
}

export function numIn(x: number, digits = 0): string {
  return new Intl.NumberFormat("en-IN", { maximumFractionDigits: digits }).format(x);
}
