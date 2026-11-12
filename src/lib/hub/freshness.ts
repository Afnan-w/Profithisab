/**
 * Freshness, staleness and timezone presentation for the Investment Data Hub.
 *
 * Pure functions (no filesystem) so the display rules can be unit-tested:
 *  - every figure is stamped with its source, data date and fetch time (Asia/Dhaka)
 *  - delayed sources always say they are delayed — never presented as real-time
 *  - a fetch older than the expected interval raises "Data may be outdated"
 *  - manual data is labelled "manually updated on [date]"
 */

export const DHAKA_TZ = "Asia/Dhaka";

/** How stale a source may get before we show the "Data may be outdated" warning. */
export const EXPECTED_INTERVAL: Record<"daily" | "fifteen-minutes" | "manual" | "unknown", number> = {
  /** Daily sources are expected at least once a day (36h allows a missed run). */
  daily: 36 * 60 * 60 * 1000,
  /** Index sources are expected every 15 minutes during trading (45m allows 2 misses). */
  "fifteen-minutes": 45 * 60 * 1000,
  /** Manual sources have no schedule — never flagged as stale, only labelled manual. */
  manual: Number.POSITIVE_INFINITY,
  unknown: Number.POSITIVE_INFINITY,
};

export type ScheduleKind = keyof typeof EXPECTED_INTERVAL;

/** Map a source's `schedule` string from data/sources.json to a freshness class. */
export function scheduleKind(schedule: string | null | undefined): ScheduleKind {
  if (!schedule) return "unknown";
  const s = schedule.toLowerCase();
  if (s.includes("manual")) return "manual";
  if (s.includes("15")) return "fifteen-minutes";
  if (s.includes("daily")) return "daily";
  return "unknown";
}

export interface FreshnessInput {
  fetchedAt: string | null | undefined;
  schedule: string | null | undefined;
  /** Injected in tests; defaults to now. */
  now?: number;
}

export interface Freshness {
  fetchedAt: string | null;
  kind: ScheduleKind;
  /** True when we are past the expected fetch interval → show "Data may be outdated". */
  outdated: boolean;
  /** Milliseconds since the last fetch, or null when we never fetched. */
  ageMs: number | null;
}

export function freshness({ fetchedAt, schedule, now = Date.now() }: FreshnessInput): Freshness {
  const kind = scheduleKind(schedule);
  if (!fetchedAt) return { fetchedAt: null, kind, outdated: false, ageMs: null };
  const t = Date.parse(fetchedAt);
  if (!Number.isFinite(t)) return { fetchedAt: null, kind, outdated: false, ageMs: null };
  const ageMs = now - t;
  const limit = EXPECTED_INTERVAL[kind];
  return { fetchedAt, kind, outdated: ageMs > limit, ageMs };
}

/* ── Asia/Dhaka presentation ───────────────────────────────────────────────── */

function fmt(iso: string, opts: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat("en-GB", { ...opts, timeZone: DHAKA_TZ }).format(new Date(iso));
}

/** "11 Nov 2026" in Asia/Dhaka. */
export function dhakaDate(iso: string | null | undefined): string | null {
  if (!iso || !Number.isFinite(Date.parse(iso))) return null;
  return fmt(iso, { day: "numeric", month: "short", year: "numeric" });
}

/** "11 Nov 2026, 4:12 PM" in Asia/Dhaka. */
export function dhakaDateTime(iso: string | null | undefined): string | null {
  if (!iso || !Number.isFinite(Date.parse(iso))) return null;
  return `${fmt(iso, { day: "numeric", month: "short", year: "numeric" })}, ${fmt(iso, {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  })}`;
}

/** Every timestamp on the hub carries this suffix so the zone is never ambiguous. */
export const TZ_LABEL = "Asia/Dhaka";

/** "Delayed by up to 15 minutes" — null when the source is not delayed. */
export function delayLabel(delayMinutes: number | null | undefined): string | null {
  if (delayMinutes === null || delayMinutes === undefined || !Number.isFinite(delayMinutes) || delayMinutes <= 0) return null;
  return `Delayed by up to ${Math.round(delayMinutes)} minutes`;
}

/** "manually updated on 11 Nov 2026". */
export function manualLabel(dataDate: string | null | undefined): string | null {
  const d = dhakaDate(dataDate ?? null);
  return d ? `manually updated on ${d}` : null;
}
