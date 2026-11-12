import fs from "node:fs";
import path from "node:path";
import { freshness, type Freshness, scheduleKind } from "@/lib/hub/freshness";

/**
 * Server-only loader for the Investment Data Hub.
 *
 * Reads the committed source registry (data/sources.json), the fetch pipeline's
 * result files (data/<data_type>-<source_id>.json), per-fund NAV history
 * (data/nav-history/*.json), manual overrides (data/manual/*.json), the
 * Shariah status registry (data/shariah-status.json) and the calculator tax
 * config (config/tax.json).
 *
 * Never import this from a "use client" component — it reads the filesystem.
 * Result files are last-good data: when a fetch fails validation the pipeline
 * keeps the previous file, so whatever is on disk is the best validated data.
 */

const ROOT = process.cwd();
export const HUB_DATA_DIR = path.join(ROOT, "data");
export const HUB_MANUAL_DIR = path.join(HUB_DATA_DIR, "manual");
export const HUB_NAV_HISTORY_DIR = path.join(HUB_DATA_DIR, "nav-history");
export const HUB_CONFIG_DIR = path.join(ROOT, "config");

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

/* ── types ─────────────────────────────────────────────────────────────────── */

export interface HubSource {
  id: string;
  name: string;
  /** Adapter type: rss | json-api | html | manual. */
  type: string;
  url: string | null;
  /** nav | rates | fdr | index | other — selects the result file name. */
  data_type: string;
  category: string | null;
  schedule: string | null;
  delay_minutes: number | null;
  enabled: boolean;
}

export interface HubRecord {
  value: number;
  data_date: string;
  source_name: string;
  source_url: string;
  label?: string | null;
  category?: string | null;
  delay_minutes?: number | null;
  /** Set when a manual override replaced this record (data/manual/*.json). */
  manual?: boolean;
}

export interface HubResult {
  source_id: string;
  source_name: string;
  source_url: string | null;
  data_type: string;
  category: string | null;
  data_date: string | null;
  fetched_at: string;
  schedule: string | null;
  delay_minutes: number | null;
  /** True for data shipped with the repo so pages render before the first fetch. */
  sample: boolean;
  note: string | null;
  records: HubRecord[];
}

export interface HubSourceStatus {
  source: HubSource;
  /** null = the source has never produced a result file. */
  result: HubResult | null;
  fresh: Freshness;
  sample: boolean;
  /** "Delayed by up to 15 minutes" — null when the source is not delayed. */
  delayLabel: string | null;
  /** Past the expected fetch interval → show "Data may be outdated". */
  stale: boolean;
  /** Schedule is "manual update" → show "manually updated on [date]". */
  manual: boolean;
}

export interface NavHistory {
  slug: string;
  source_name: string;
  source_url: string | null;
  fetched_at: string;
  sample: boolean;
  note: string | null;
  points: Array<{ date: string; nav: number }>;
}

export interface ShariahStatus {
  slug: string;
  status: string;
  source_name: string;
  source_url: string;
  quote: string;
  checked_on: string;
}

export interface TaxConfig {
  asOf: string;
  note: string;
  mutualFund: { dividendTaxPct: number; capitalGainsTaxPct: number; note: string };
  sonchayapatra: { interestTaxPct: number; note: string };
  fdr: { interestTaxPct: number; note: string };
  savingsCertificate: { interestTaxPct: number; note: string };
}

/* ── reading helpers ───────────────────────────────────────────────────────── */

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

/** Required file: a missing or unreadable copy stops `npm run build` with a clear error. */
function requiredJson<T>(file: string): T {
  let text: string;
  try {
    text = fs.readFileSync(file, "utf8");
  } catch {
    throw new Error(`Missing hub data file: ${file}`);
  }
  try {
    return JSON.parse(text) as T;
  } catch (e) {
    throw new Error(`Invalid JSON in ${file}: ${e instanceof Error ? e.message : String(e)}`);
  }
}

/** Optional file: absent → null (an empty state, not a crash). */
function optionalJson<T>(file: string): T | null {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8")) as T;
  } catch {
    return null;
  }
}

function str(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

function nullableStr(v: unknown): string | null {
  return typeof v === "string" && v.trim() ? v : null;
}

function num(v: unknown): number | null {
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

/** Display records are filtered, not crashed on: a bad row is skipped. */
function readRecords(raw: unknown): HubRecord[] {
  if (!Array.isArray(raw)) return [];
  const out: HubRecord[] = [];
  for (const item of raw) {
    if (!isRecord(item)) continue;
    const value = num(item.value);
    const data_date = str(item.data_date);
    if (value === null || !ISO_DATE.test(data_date)) continue;
    out.push({
      value,
      data_date,
      source_name: str(item.source_name),
      source_url: str(item.source_url),
      label: nullableStr(item.label),
      category: nullableStr(item.category),
      delay_minutes: num(item.delay_minutes),
      manual: item.manual === true,
    });
  }
  return out;
}

/* ── source registry ───────────────────────────────────────────────────────── */

let sourcesCache: HubSource[] | null = null;

export function hubSources(): HubSource[] {
  if (sourcesCache) return sourcesCache;
  const raw = requiredJson<{ sources?: unknown }>(path.join(HUB_DATA_DIR, "sources.json"));
  const list = Array.isArray(raw.sources) ? raw.sources : [];
  sourcesCache = list.filter(isRecord).map((s) => ({
    id: str(s.id),
    name: str(s.name),
    type: str(s.type),
    url: nullableStr(s.url),
    data_type: str(s.data_type),
    category: nullableStr(s.category),
    schedule: nullableStr(s.schedule),
    delay_minutes: num(s.delay_minutes),
    enabled: s.enabled === true,
  })).filter((s) => s.id && s.data_type);
  return sourcesCache;
}

/** Result file path written by scripts/fetch/store.ts#resultPath. */
export function hubResultPath(source: Pick<HubSource, "data_type" | "id">): string {
  return path.join(HUB_DATA_DIR, `${source.data_type}-${source.id}.json`);
}

export function loadHubResult(source: HubSource): HubResult | null {
  const raw = optionalJson<Record<string, unknown>>(hubResultPath(source));
  if (!raw) return null;
  return {
    source_id: source.id,
    source_name: str(raw.source_name, source.name),
    source_url: nullableStr(raw.source_url) ?? source.url,
    data_type: str(raw.data_type, source.data_type),
    category: nullableStr(raw.category) ?? source.category,
    data_date: nullableStr(raw.data_date),
    fetched_at: str(raw.fetched_at),
    schedule: nullableStr(raw.schedule) ?? source.schedule,
    delay_minutes: num(raw.delay_minutes) ?? source.delay_minutes,
    sample: raw.sample === true,
    note: nullableStr(raw.note),
    records: readRecords(raw.records),
  };
}

/* ── manual overrides (data/manual/*.json) ─────────────────────────────────── */

export interface ManualEntry {
  /** File name without .json — also the default label. */
  file: string;
  label: string;
  value: number;
  data_date: string;
  source_name: string;
  source_url: string;
  updated: string | null;
}

/**
 * Manual override entries. Files marked `"draft": true` are skipped so a
 * template can ship in the repo without being ingested when the manual source
 * is enabled.
 */
export function manualEntries(): ManualEntry[] {
  let files: string[];
  try {
    files = fs.readdirSync(HUB_MANUAL_DIR).filter((f) => f.endsWith(".json"));
  } catch {
    return [];
  }
  const out: ManualEntry[] = [];
  for (const file of files.sort()) {
    const raw = optionalJson<Record<string, unknown>>(path.join(HUB_MANUAL_DIR, file));
    if (!raw || raw.draft === true) continue;
    const value = num(raw.value);
    const data_date = str(raw.data_date) || str(raw.updated);
    if (value === null || !ISO_DATE.test(data_date)) continue;
    const slug = file.replace(/\.json$/, "");
    out.push({
      file,
      label: str(raw.label, slug),
      value,
      data_date,
      source_name: str(raw.source_name),
      source_url: str(raw.source_url),
      updated: nullableStr(raw.updated),
    });
  }
  return out;
}

/**
 * Merge manual overrides over fetched records. A manual entry wins when its
 * label matches a fetched record's label (case-insensitive), or it is appended
 * as a new record. Merged records are flagged so the UI labels them
 * "manually updated on [date]".
 */
export function mergeManual(result: HubResult): HubRecord[] {
  const entries = manualEntries();
  if (!entries.length) return result.records;
  const records = result.records.map((r) => ({ ...r }));
  for (const entry of entries) {
    const hit = records.find((r) => (r.label ?? "").toLowerCase() === entry.label.toLowerCase());
    if (hit) {
      hit.value = entry.value;
      hit.data_date = entry.data_date;
      hit.source_name = entry.source_name || hit.source_name;
      hit.source_url = entry.source_url || hit.source_url;
      hit.manual = true;
    } else {
      records.push({
        value: entry.value,
        data_date: entry.data_date,
        source_name: entry.source_name || result.source_name,
        source_url: entry.source_url || result.source_url || "",
        label: entry.label,
        category: result.category,
        delay_minutes: result.delay_minutes,
        manual: true,
      });
    }
  }
  return records;
}

/* ── per-source status ─────────────────────────────────────────────────────── */

export function sourceStatus(source: HubSource, now = Date.now()): HubSourceStatus {
  const result = loadHubResult(source);
  const fresh = freshness({ fetchedAt: result?.fetched_at, schedule: source.schedule, now });
  return {
    source,
    result,
    fresh,
    sample: result?.sample ?? false,
    delayLabel: delayLabelFor(result?.delay_minutes ?? source.delay_minutes),
    stale: result ? fresh.outdated : false,
    manual: scheduleKind(source.schedule) === "manual",
  };
}

function delayLabelFor(minutes: number | null): string | null {
  if (minutes === null || minutes <= 0) return null;
  return `Delayed by up to ${Math.round(minutes)} minutes`;
}

export function allSourceStatuses(now = Date.now()): HubSourceStatus[] {
  return hubSources().map((s) => sourceStatus(s, now));
}

/** Convenience: the status + records for one source id (e.g. "sonchayapatra-rates"). */
export function sourceById(id: string, now = Date.now()): HubSourceStatus | null {
  return hubSources().find((s) => s.id === id) ? sourceStatus(hubSources().find((s) => s.id === id)!, now) : null;
}

/* ── NAV history ───────────────────────────────────────────────────────────── */

export function loadNavHistory(slug: string): NavHistory | null {
  const raw = optionalJson<Record<string, unknown>>(path.join(HUB_NAV_HISTORY_DIR, `${slug}.json`));
  if (!raw || !Array.isArray(raw.points)) return null;
  const points: Array<{ date: string; nav: number }> = [];
  for (const p of raw.points) {
    if (!isRecord(p)) continue;
    const nav = num(p.nav);
    const date = str(p.date);
    if (nav !== null && nav > 0 && ISO_DATE.test(date)) points.push({ date, nav });
  }
  points.sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  if (!points.length) return null;
  return {
    slug: str(raw.slug, slug),
    source_name: str(raw.source_name),
    source_url: nullableStr(raw.source_url),
    fetched_at: str(raw.fetched_at),
    sample: raw.sample === true,
    note: nullableStr(raw.note),
    points,
  };
}

export function navHistorySlugs(): string[] {
  try {
    return fs.readdirSync(HUB_NAV_HISTORY_DIR).filter((f) => f.endsWith(".json")).map((f) => f.replace(/\.json$/, ""));
  } catch {
    return [];
  }
}

/** Month-end NAV series for the SVG chart: labels "YYYY-MM", one value per month. */
export function monthlyNav(points: Array<{ date: string; nav: number }>): { labels: string[]; values: number[] } {
  const last = new Map<string, { date: string; nav: number }>();
  for (const p of points) {
    const m = p.date.slice(0, 7);
    const cur = last.get(m);
    if (!cur || p.date >= cur.date) last.set(m, p); // points are ascending; last row of a month wins
  }
  const labels = [...last.keys()].sort();
  return { labels, values: labels.map((m) => last.get(m)!.nav) };
}

/* ── Shariah status (documented sources only — never inferred from names) ──── */

let shariahCache: ShariahStatus[] | null = null;

export function shariahRegistry(): ShariahStatus[] {
  if (shariahCache) return shariahCache;
  const raw = optionalJson<{ funds?: unknown }>(path.join(HUB_DATA_DIR, "shariah-status.json"));
  const list = Array.isArray(raw?.funds) ? raw.funds : [];
  shariahCache = list.filter(isRecord).map((f) => ({
    slug: str(f.slug),
    status: str(f.status),
    source_name: str(f.source_name),
    source_url: str(f.source_url),
    quote: str(f.quote),
    checked_on: str(f.checked_on),
  })).filter((f) => f.slug && f.source_url);
  return shariahCache;
}

/**
 * Shariah status for a fund, or null when no official source states it.
 * A null means "not confirmed" — never read as either compliant or
 * non-compliant, and never guessed from the fund's name.
 */
export function shariahStatusFor(slug: string): ShariahStatus | null {
  return shariahRegistry().find((f) => f.slug === slug) ?? null;
}

/* ── calculator tax config ─────────────────────────────────────────────────── */

export function taxConfig(): TaxConfig {
  const raw = requiredJson<Record<string, unknown>>(path.join(HUB_CONFIG_DIR, "tax.json"));
  const section = (key: string): Record<string, unknown> => (isRecord(raw[key]) ? raw[key] : {});
  const mf = section("mutualFund");
  const sc = section("sonchayapatra");
  const fdr = section("fdr");
  const savings = section("savingsCertificate");
  return {
    asOf: str(raw.asOf),
    note: str(raw.note),
    mutualFund: { dividendTaxPct: num(mf.dividendTaxPct) ?? 0, capitalGainsTaxPct: num(mf.capitalGainsTaxPct) ?? 0, note: str(mf.note) },
    sonchayapatra: { interestTaxPct: num(sc.interestTaxPct) ?? 0, note: str(sc.note) },
    fdr: { interestTaxPct: num(fdr.interestTaxPct) ?? 0, note: str(fdr.note) },
    savingsCertificate: { interestTaxPct: num(savings.interestTaxPct) ?? 0, note: str(savings.note) },
  };
}
