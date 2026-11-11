/**
 * Single source of truth for the public site address.
 *
 * Canonicals, the sitemap, robots.txt, Open Graph URLs and JSON-LD all read
 * SITE_URL from here. Override it with NEXT_PUBLIC_SITE_URL when the domain
 * changes (for example after connecting a custom domain in Vercel).
 */
const FALLBACK_SITE_URL = "https://profithisab.vercel.app";

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL || FALLBACK_SITE_URL).replace(/\/+$/, "");

export const SITE_NAME = "Profithisab";

/** A fund with no NAV in this many days is flagged and kept out of rankings. */
export const STALE_AFTER_DAYS = 30;

/** Minimum number of NAV observations before we show any return figure. */
export const MIN_NAV_POINTS = 2;

export const PERIODS = [
  { id: "1y", label: "1 year", years: 1 },
  { id: "3y", label: "3 years", years: 3 },
  { id: "5y", label: "5 years", years: 5 },
  { id: "max", label: "Since launch", years: null },
] as const;

export type PeriodId = (typeof PERIODS)[number]["id"];

export function periodYears(id: PeriodId): number | null {
  return PERIODS.find((p) => p.id === id)?.years ?? null;
}
