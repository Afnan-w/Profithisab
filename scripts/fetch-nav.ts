import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { z } from "zod";
import { DATA_DIR } from "../src/lib/data";
import { isValidISODate, todayISO } from "../src/lib/date";
import { benchmarksFileSchema } from "../src/lib/schema";

/**
 * `npm run data:fetch`
 *
 * Fetches NAV data directly from the first-party sources listed in
 * data/nav-sources.json (AMC websites + the LankaBangla fund-universe table) and
 * writes normalised JSON files into data/incoming/, which `data:import` then
 * merges into data/funds.json and data/nav/.
 *
 * Politeness contract:
 *  - clear User-Agent with a contact address;
 *  - at least REQUEST_DELAY_MS between network requests;
 *  - same-day raw cache in data/raw/ (gitignored) so reruns don't re-hit sites;
 *  - the run stops immediately on 403/429 (the site is telling us to back off).
 */

export const USER_AGENT = "ProfithisabDataBot/1.0 (https://profithisab.vercel.app; contact data@profithisab.com)";
const REQUEST_DELAY_MS = 2500;
const RAW_DIR = path.join(DATA_DIR, "raw");
const INCOMING_DIR = path.join(DATA_DIR, "incoming");
const ROSTER_FILE = path.join(DATA_DIR, "market-roster.json");

/* ── Source registry (data/nav-sources.json) ──────────────────────────────────── */

const sourceEntrySchema = z.object({
  id: z.string(),
  name: z.string(),
  url: z.string(),
  kind: z.string(),
  role: z.string(),
  note: z.string().optional(),
});

const fundMetaSchema = z.object({
  slug: z.string(),
  name: z.string(),
  acronym: z.string(),
  amc: z.string(),
  type: z.enum(["growth", "balanced", "income"]),
  shariah: z.boolean(),
  sources: z.record(z.string(), z.record(z.string(), z.string())),
});

const sourcesFileSchema = z.object({
  schemaVersion: z.literal(1),
  updated: z.string(),
  navConvention: z.string(),
  sources: z.array(sourceEntrySchema),
  funds: z.array(fundMetaSchema),
});

export type FundMeta = z.infer<typeof fundMetaSchema>;
export type SourcesFile = z.infer<typeof sourcesFileSchema>;

export function loadSources(): SourcesFile {
  const raw = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "nav-sources.json"), "utf8"));
  return sourcesFileSchema.parse(raw);
}

/* ── Incoming-file shape (consumed by scripts/import.ts) ──────────────────── */

export interface IncomingFundRow {
  slug: string;
  name: string;
  acronym: string;
  amc: string;
  type: string;
  shariah: boolean;
  fundSize: number | null;
}

export interface NavRow {
  fund: string;
  date: string;
  nav: number;
}

export interface DividendRow {
  fund: string;
  recordDate: string;
  amount: number;
}

export interface IncomingFile {
  funds: IncomingFundRow[];
  history: NavRow[];
  dividends: DividendRow[];
}

/* ── Polite HTTP with same-day cache ──────────────────────────────────────── */

export class BlockedByServer extends Error {
  constructor(status: number, url: string) {
    super(`Server returned ${status} for ${url} — stopping this run (the site is asking us to back off).`);
  }
}

let lastNetworkAt = 0;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function rawCachePath(key: string): string {
  return path.join(RAW_DIR, key.replace(/[^a-z0-9.-]+/gi, "_"));
}

function isFreshCache(file: string): boolean {
  if (!fs.existsSync(file)) return false;
  const mtime = new Date(fs.statSync(file).mtimeMs);
  const now = new Date();
  return (
    mtime.getFullYear() === now.getFullYear() &&
    mtime.getMonth() === now.getMonth() &&
    mtime.getDate() === now.getDate()
  );
}

export async function politeFetch(
  url: string,
  opts: { method?: string; body?: string; cacheKey: string; noCache?: boolean } 
): Promise<string> {
  const cache = rawCachePath(opts.cacheKey);
  if (!opts.noCache && isFreshCache(cache)) {
    return fs.readFileSync(cache, "utf8");
  }
  const since = Date.now() - lastNetworkAt;
  if (since < REQUEST_DELAY_MS) await sleep(REQUEST_DELAY_MS - since);
  lastNetworkAt = Date.now();

  const res = await fetch(url, {
    method: opts.method ?? "GET",
    headers: {
      "user-agent": USER_AGENT,
      accept: "text/html,application/json;q=0.9,*/*;q=0.8",
      "accept-language": "en",
      ...(opts.body ? { "content-type": "application/x-www-form-urlencoded" } : {}),
    },
    body: opts.body,
  });
  if (res.status === 403 || res.status === 429) throw new BlockedByServer(res.status, url);
  if (!res.ok) throw new Error(`HTTP ${res.status} for ${url}`);
  const text = await res.text();
  fs.mkdirSync(RAW_DIR, { recursive: true });
  fs.writeFileSync(cache, text);
  return text;
}

/* ── Small HTML / date helpers ────────────────────────────────────────────── */

function stripTags(s: string): string {
  return s
    .replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}

function cellsOf(tr: string): string[] {
  const out: string[] = [];
  for (const m of tr.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)) out.push(stripTags(m[1]));
  return out;
}

const MONTHS: Record<string, string> = {
  jan: "Jan", feb: "Feb", mar: "Mar", apr: "Apr", may: "May", jun: "Jun",
  jul: "Jul", aug: "Aug", sep: "Sep", oct: "Oct", nov: "Nov", dec: "Dec",
};

const MONTH_ORDER: Record<string, number> = {
  Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6,
  Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12,
};

/** "November 10, 2026" / "10-Nov-26" / "8-Mar-18" → YYYY-MM-DD (or null). */
export function parseNavDate(raw: string): string | null {
  const s = raw.trim().replace(/,/g, " ");
  // Already ISO: "2020-01-02"
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    const iso = s.slice(0, 10);
    return isValidISODate(iso) ? iso : null;
  }
  // Month-name first: "November 10 2026"
  const mdY = s.match(/^([A-Za-z]{3,})\s+(\d{1,2})\s+(\d{4})$/);
  if (mdY) {
    const mi = MONTH_ORDER[mdY[1].slice(0, 3).replace(/^./, (c) => c.toUpperCase())];
    if (mi) return `${mdY[3]}-${String(mi).padStart(2, "0")}-${String(Number(mdY[2])).padStart(2, "0")}`;
  }
  // Day first: "8-Mar-18" (Shanta style)
  const dmY = s.match(/^(\d{1,2})[-\s]([A-Za-z]{3,})[-\s](\d{2,4})$/);
  if (dmY) {
    const mi = MONTH_ORDER[dmY[2].slice(0, 3).replace(/^./, (c) => c.toUpperCase())];
    if (mi) {
      let year = Number(dmY[3]);
      if (year < 100) year += 2000;
      return `${year}-${String(mi).padStart(2, "0")}-${String(Number(dmY[1])).padStart(2, "0")}`;
    }
  }
  return null;
}

function num(raw: string): number | null {
  const s = raw.replace(/[,%\s৳]/g, "").trim();
  if (!s || s.toLowerCase() === "n/a" || s.toLowerCase() === "na" || s === "-") return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

export function normalizeName(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/* ── Adapter: Shanta (fund pages embed full NAV history as JSON) ──────────── */

export interface DsePoint {
  date: string;
  dsex: number | null;
  ds30: number | null;
  dses: number | null;
}

export interface ShantaPayload {
  fundSlugs: string[];
  navs: NavRow[];
  dividends: DividendRow[];
  /** Daily DSE index levels embedded in every Shanta fund page (date, dsex, ds30, dses). */
  dse: DsePoint[];
}

export function parseShantaPage(html: string): ShantaPayload {
  const m = html.match(/<script id="__NEXT_DATA__" type="application\/json"[^>]*>([\s\S]*?)<\/script>/);
  if (!m) throw new Error("Shanta page has no __NEXT_DATA__ payload — layout may have changed.");
  const props = (JSON.parse(m[1]) as { props?: { pageProps?: Record<string, unknown> } }).props?.pageProps ?? {};
  const list =
    ((props.data as { data?: { list?: unknown[] } })?.data?.list as Array<Record<string, unknown>> | undefined) ?? [];

  const navs: NavRow[] = [];
  const dividends: DividendRow[] = [];
  const fundSlugs: string[] = [];

  for (const item of list) {
    const page = (item.page_data ?? {}) as Record<string, unknown>;
    const slug = typeof page.slug === "string" ? page.slug : null;
    if (!slug) continue;
    fundSlugs.push(slug);

    const perf = (item.performance ?? {}) as { data?: Array<Record<string, unknown>> };
    for (const row of perf.data ?? []) {
      const date = typeof row.Date === "string" ? parseNavDate(row.Date) : null;
      const nav = typeof row.Nav === "number" ? row.Nav : num(String(row.Nav ?? ""));
      if (date && nav !== null && nav > 0) navs.push({ fund: slug, date, nav });
    }
  }

  const divData = (props.dividendData as { data?: Array<Record<string, unknown>> } | undefined)?.data ?? [];
  for (const d of divData) {
    const key = typeof d.fund_type === "string" ? d.fund_type.toLowerCase() : "";
    const date = typeof d.date === "string" ? parseNavDate(d.date) : null;
    const amount = num(String(d.value ?? ""));
    if (key && date && amount !== null && amount > 0) dividends.push({ fund: key, recordDate: date, amount });
  }

  const dseRaw = (props.dseData as Array<Record<string, unknown>> | undefined) ?? [];
  const dse: DsePoint[] = [];
  for (const r of dseRaw) {
    const date = typeof r.date === "string" && isValidIso(r.date) ? r.date : null;
    if (!date) continue;
    dse.push({
      date,
      dsex: num(String(r.dsex ?? "")),
      ds30: num(String(r.ds30 ?? "")),
      dses: num(String(r.dses ?? "")),
    });
  }
  return { fundSlugs, navs, dividends, dse };
}

function isValidIso(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(s) && !Number.isNaN(Date.parse(s));
}

/* ── Adapter: IDLC (historic NAV AJAX table) ─────────────────────────────── */

export function parseIdlcTable(html: string): NavRow[] {
  const out: NavRow[] = [];
  for (const chunk of html.split(/<tr[^>]*>/i)) {
    const cells = cellsOf(chunk.slice(0, chunk.indexOf("</tr>") + 5));
    // Columns: Fund Name, NAV Date, NAV at Cost, NAV at Fair Value, Buy, Sale
    if (cells.length < 4) continue;
    const name = cells[0];
    const date = parseNavDate(cells[1]);
    const nav = num(cells[3]); // NAV at Fair Value — the standard quoted NAV
    if (!name || !date || nav === null || nav <= 0) continue;
    out.push({ fund: name, date, nav });
  }
  return out;
}

/* ── Adapter: EDGE AMC (fund pages embed the full NAV history as a Google Charts table) ── */

export interface EdgePayload {
  navs: NavRow[];
  /** AUM in crore, from the page's Fund Size tile. */
  fundSize: number | null;
  /** Inception date (YYYY-MM-DD) from the page's Inception Date tile. */
  inception: string | null;
}

/**
 * Every EDGE AMC fund page (https://www.edgeamc.com/<fund-slug>) embeds:
 *  - a Google Charts series `[['Date','<CODE>','DSEX','DS30'], [new Date(y,m,d), nav, dsex, ds30], …]`
 *    holding the complete daily NAV history since inception;
 *  - a Fund Summary with Inception Date and Fund Size tiles.
 * The series uses JS month indexing (0-based), so month+1 gives the real month.
 */
export function parseEdgePage(html: string): EdgePayload {
  const navs: NavRow[] = [];
  const m = html.match(/arrayToDataTable\(\[\s*\['Date',\s*'[^']+'(?:\s*,\s*'[^']+'){0,3}\],([\s\S]*?)\]\s*\)/);
  if (m) {
    for (const r of m[1].matchAll(/new Date\((\d{4}),\s*(\d{1,2}),\s*(\d{1,2})\),\s*([\d.]+)/g)) {
      const date = `${r[1]}-${String(Number(r[2]) + 1).padStart(2, "0")}-${String(Number(r[3])).padStart(2, "0")}`;
      const nav = Number(r[4]);
      if (isValidISODate(date) && nav > 0) navs.push({ fund: "", date, nav });
    }
  }

  let fundSize: number | null = null;
  let inception: string | null = null;
  for (const tile of html.matchAll(/<h4>([^<]+)<\/h4>\s*<\/div>[\s\S]{0,200}?<h5>([^<]+)<\/h5>/g)) {
    const label = stripTags(tile[1]);
    const value = stripTags(tile[2]);
    if (/fund size/i.test(label)) {
      const amount = Number(value.replace(/[^\d.]/g, ""));
      if (Number.isFinite(amount) && amount > 0) fundSize = Math.round((amount / 10_000_000) * 100) / 100; // crore
    } else if (/inception/i.test(label)) {
      inception = parseNavDate(value);
    }
  }
  return { navs, fundSize, inception };
}

async function fetchEdge(roster: Roster | null, noCache: boolean): Promise<FetchResult> {
  console.log("→ EDGE AMC: fund pages (embedded NAV history)…");
  const sources = loadSources();
  const edgeFunds = sources.funds.filter((f) => f.sources.edge);
  if (!edgeFunds.length) throw new Error("No EDGE funds configured in data/nav-sources.json");

  const navs: NavRow[] = [];
  const dividends: DividendRow[] = [];
  const sizes = new Map<string, number | null>();
  for (const fund of edgeFunds) {
    const slug = fund.sources.edge!.slug;
    const html = await politeFetch(`https://www.edgeamc.com/${slug}`, {
      cacheKey: `edge-${slug}.html`,
      noCache,
    });
    const payload = parseEdgePage(html);
    for (const row of payload.navs) navs.push({ fund: fund.slug, date: row.date, nav: row.nav });
    sizes.set(fund.slug, payload.fundSize);
    console.log(`  ${fund.name}: ${payload.navs.length} NAV rows · size ${payload.fundSize ?? "—"} crore · inception ${payload.inception ?? "—"}`);
  }

  // The EDGE page tiles are fresher than the weekly roster, so they win when present.
  const { rows } = fundRowsFor("edge", new Set(), roster);
  const funds = rows.map((r) => ({ ...r, fundSize: sizes.get(r.slug) ?? r.fundSize }));

  const incoming: IncomingFile = { funds, history: navs, dividends };
  fs.writeFileSync(path.join(INCOMING_DIR, "edge.json"), `${JSON.stringify(incoming, null, 2)}\n`);

  return {
    source: "edge",
    navRows: navs.length,
    dividendRows: 0,
    funds: edgeFunds.length,
    detail:
      "NAV history, fund size and inception from each fund's own page. EDGE publishes dividends as fiscal-year " +
      "percentages without record dates — not imported until record dates are confirmed (see data/review-needed.json).",
  };
}

/* ── Adapter: LankaBangla AML (public NAV-history API on lbamcl.com) ──────── */

/**
 * lbamcl.com/nav drives its "Historical Nav" table from an unauthenticated
 * endpoint:
 *   POST https://lbamcl.com/api/include/classes/frontend/getnav.php?action=history
 *   body: fund_name=<1|5|6|7|8>&from_date=YYYY-MM-DD&to_date=YYYY-MM-DD
 * Rows are [fundName, inceptionDate, navDate, nav, …, DSEX]. NAVs are weekly
 * (the AMC computes NAV weekly) and the series runs since inception.
 */
export function parseLbNavHistory(json: string): NavRow[] {
  const doc = JSON.parse(json) as { data?: unknown[][] };
  const out: NavRow[] = [];
  for (const row of doc.data ?? []) {
    const date = parseNavDate(String(row[2] ?? ""));
    const nav = num(String(row[3] ?? ""));
    if (date && nav !== null && nav > 0) out.push({ fund: String(row[0] ?? ""), date, nav });
  }
  return out;
}

async function fetchLankabangla(roster: Roster | null, noCache: boolean): Promise<FetchResult> {
  console.log("→ LankaBangla AML: NAV-history API…");
  const sources = loadSources();
  const lbFunds = sources.funds.filter((f) => f.sources.lbaml);
  if (!lbFunds.length) throw new Error("No LankaBangla AML funds configured in data/nav-sources.json");

  const navs: NavRow[] = [];
  for (const fund of lbFunds) {
    const key = fund.sources.lbaml!.key;
    const json = await politeFetch("https://lbamcl.com/api/include/classes/frontend/getnav.php?action=history", {
      method: "POST",
      body: new URLSearchParams({
        fund_name: key,
        from_date: "2000-01-01",
        to_date: todayISO(),
      }).toString(),
      cacheKey: `lbaml-fund-${key}.json`,
      noCache,
    });
    const parsed = parseLbNavHistory(json);
    const seen = new Set<string>();
    for (const row of parsed) {
      if (seen.has(row.date)) continue;
      seen.add(row.date);
      navs.push({ fund: fund.slug, date: row.date, nav: row.nav });
    }
    console.log(`  ${fund.name}: ${seen.size} NAV rows`);
  }

  const { rows } = fundRowsFor("lbaml", new Set(), roster);
  const incoming: IncomingFile = { funds: rows, history: navs, dividends: [] };
  fs.writeFileSync(path.join(INCOMING_DIR, "lbaml.json"), `${JSON.stringify(incoming, null, 2)}\n`);

  return {
    source: "lbaml",
    navRows: navs.length,
    dividendRows: 0,
    funds: lbFunds.length,
    detail: "Weekly NAV history from the AMC's own public endpoint. Dividend record dates not published in this endpoint yet.",
  };
}

/* ── Adapter: LankaBangla open-end fund table (roster snapshot) ──────────── */

export interface RosterFund {
  mfid: string;
  name: string;
  amc: string;
  nav: number | null;
  sellingPrice: number | null;
  repurchasePrice: number | null;
  entryLoadPct: number | null;
  exitLoadPct: number | null;
  navReturnYtdPct: number | null;
  navReturnPrevYearPct: number | null;
  weeklyChangePct: number | null;
  latestDividendPct: number | null;
  dividendToSellingPct: number | null;
  aumMillion: number | null;
  inception: string | null;
}

export interface Roster {
  asOf: string;
  funds: RosterFund[];
}

export function parseLankabdTable(html: string, fallbackDate: string): Roster {
  // "NAV Per Unit at Market Price is as on October 19, 2026"
  const asOn = html.match(/is as on\s+([A-Za-z]+\s+\d{1,2},?\s+\d{4})/);
  const asOf = asOn ? parseNavDate(asOn[1]) ?? fallbackDate : fallbackDate;

  const funds: RosterFund[] = [];
  let currentAmc = "";
  for (const chunk of html.split(/<tr[^>]*>/i)) {
    const row = chunk.slice(0, chunk.indexOf("</tr>") + 5);
    if (!row.includes("<td")) continue;
    const hasFundLink = row.includes("/MF/Overview");
    const text = stripTags(row);

    if (!hasFundLink) {
      // AMC group rows are a single short plain-text cell. Skip headers and notes.
      if (text.includes("NAV Per Unit") || text.includes("Inception") || text.length > 90 || !text) continue;
      currentAmc = text;
      continue;
    }

    const cells = cellsOf(row);
    if (cells.length < 12) continue;
    const link = row.match(/mfid=(\d+)&mfname=([^"&]+)/);
    funds.push({
      mfid: link ? link[1] : "",
      name: cells[0],
      amc: currentAmc,
      nav: num(cells[1]),
      sellingPrice: num(cells[2]),
      repurchasePrice: num(cells[3]),
      entryLoadPct: num(cells[4]),
      exitLoadPct: num(cells[5]),
      navReturnYtdPct: num(cells[6]),
      navReturnPrevYearPct: num(cells[7]),
      weeklyChangePct: num(cells[8]),
      latestDividendPct: num(cells[9]),
      dividendToSellingPct: num(cells[10]),
      aumMillion: num(cells[11]),
      inception: cells[12] || null,
    });
  }
  return { asOf, funds };
}

/* ── Benchmarks: DSE index series from the Shanta payload ─────────────────── */

/**
 * Shanta's fund pages embed a daily DSE index table alongside the NAV history.
 * We republish it as a month-end series (last published level of each month) in
 * data/benchmarks.json so the site's charts can overlay the real index instead
 * of a flat-rate approximation. Sourced from the exchange via Shanta's public
 * pages; the series and the source attribution travel together.
 */
interface BenchFile {
  schemaVersion: number;
  benchmarks: Array<Record<string, unknown>>;
}

export function monthEndLevels(
  points: DsePoint[],
  pick: (p: DsePoint) => number | null
): Array<{ date: string; value: number }> {
  const byMonth = new Map<string, { date: string; value: number }>();
  for (const p of points) {
    const value = pick(p);
    if (value === null || value <= 0 || !Number.isFinite(value)) continue;
    byMonth.set(p.date.slice(0, 7), { date: p.date, value }); // rows arrive chronological; the last row of a month wins
  }
  return [...byMonth.values()].sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

/** Annualised growth of the published series; needs at least one full year. */
export function cagrOfLevels(series: Array<{ date: string; value: number }>): number | null {
  if (series.length < 13) return null;
  const first = series[0];
  const last = series[series.length - 1];
  const years = (Date.parse(last.date) - Date.parse(first.date)) / (365.25 * 86_400_000);
  if (years < 364 / 365.25 || first.value <= 0) return null; // 12 months counts as a year
  return (Math.pow(last.value / first.value, 1 / years) - 1) * 100;
}

export function updateDseBenchmarks(dse: DsePoint[]): string {
  if (dse.length < 250) return `DSE payload too small (${dse.length} rows) — benchmarks left unchanged.`;
  const file = path.join(DATA_DIR, "benchmarks.json");
  const doc = JSON.parse(fs.readFileSync(file, "utf8")) as BenchFile;
  const source = {
    name: "Dhaka Stock Exchange daily closing levels, republished on Shanta AML fund pages",
    url: "https://www.shanta-aml.com/our-funds/shanta-amanah-shariah-fund",
    asOf: dse[dse.length - 1].date,
  };
  const defs = [
    {
      id: "dsex",
      name: "DSEX (Dhaka Stock Exchange broad index)",
      shortName: "DSEX",
      color: "#8b5cf6",
      pick: (p: DsePoint) => p.dsex,
      note:
        "Real month-end DSEX closing levels (the last published close of each month). " +
        "Chart overlays rescale the index to the fund's tracked window; the annual rate is the index CAGR over the published series.",
    },
    {
      id: "dses",
      name: "DSES (Dhaka Stock Exchange Shariah index)",
      shortName: "DSES",
      color: "#14b8a6",
      pick: (p: DsePoint) => p.dses,
      note:
        "Real month-end DSES closing levels — the Shariah-screened index, shown next to the Shariah funds. " +
        "Same sourcing and conventions as the DSEX entry.",
    },
  ];
  for (const def of defs) {
    const levels = monthEndLevels(dse, def.pick);
    if (levels.length < 13) continue;
    const rate = cagrOfLevels(levels);
    const entry = {
      id: def.id,
      name: def.name,
      shortName: def.shortName,
      color: def.color,
      annualRate: rate === null ? null : Math.round(rate * 100) / 100,
      status: "verified",
      source,
      note: def.note,
      series: levels.map((l) => ({ date: l.date, value: l.value })),
    };
    const hit = doc.benchmarks.find((b) => b.id === def.id);
    if (hit) Object.assign(hit, entry);
    else doc.benchmarks.push(entry);
  }
  // Re-validate the whole file so a bad write fails here, not at build time.
  benchmarksFileSchema.parse(doc);
  fs.writeFileSync(file, `${JSON.stringify(doc, null, 2)}\n`);
  return `DSEX/DSES month-end series written (${dse[0].date} → ${dse[dse.length - 1].date}).`;
}

/* ── Orchestration ────────────────────────────────────────────────────────── */

interface FetchResult {
  source: string;
  navRows: number;
  dividendRows: number;
  funds: number;
  detail: string;
}

async function fetchLankabdRoster(noCache: boolean): Promise<Roster> {
  console.log("→ LankaBangla: open-end fund table (roster)…");
  const html = await politeFetch("https://www.lankabd.com/MF/OpenEndMutualFund", {
    cacheKey: "lankabd-openend.html",
    noCache,
  });
  const roster = parseLankabdTable(html, todayISO());
  console.log(`  ${roster.funds.length} funds on roster (as of ${roster.asOf})`);
  return roster;
}

/** AUM (million BDT) → crore, matched from the roster by normalised name. */
function sizeFor(name: string, roster: Roster | null): number | null {
  if (!roster) return null;
  const want = normalizeName(name);
  const hit = roster.funds.find((f) => normalizeName(f.name) === want);
  if (!hit || hit.aumMillion === null) return null;
  return Math.round((hit.aumMillion / 10) * 100) / 100; // crore
}

function fundRowsFor(
  sourceId: string,
  availableSlugs: Set<string>,
  roster: Roster | null
): { meta: FundMeta[]; rows: IncomingFundRow[] } {
  const sources = loadSources();
  const meta = sources.funds.filter((f) => {
    const s = f.sources[sourceId];
    if (!s) return false;
    const key = s.slug ?? s.key;
    return !availableSlugs.size || (key && availableSlugs.has(key));
  });
  const rows = meta.map((m) => ({
    slug: m.slug,
    name: m.name,
    acronym: m.acronym,
    amc: m.amc,
    type: m.type,
    shariah: m.shariah,
    fundSize: sizeFor(m.name, roster),
  }));
  return { meta, rows };
}

async function fetchShanta(roster: Roster | null, noCache: boolean): Promise<FetchResult> {
  console.log("→ Shanta AML: fund pages (embedded NAV history)…");
  const html = await politeFetch("https://www.shanta-aml.com/our-funds/shanta-amanah-shariah-fund", {
    cacheKey: "shanta-funds.html",
    noCache,
  });
  const payload = parseShantaPage(html);

  const sources = loadSources();
  const byPageSlug = new Map(
    sources.funds
      .filter((f) => f.sources.shanta)
      .map((f) => [f.sources.shanta!.slug as string, f])
  );
  const byDivKey = new Map(
    sources.funds
      .filter((f) => f.sources.shanta)
      .map((f) => [f.sources.shanta!.dividendKey as string, f])
  );

  const unmapped = payload.fundSlugs.filter((s) => !byPageSlug.has(s));
  if (unmapped.length) console.warn(`  ! unmapped Shanta fund page(s): ${unmapped.join(", ")} — skipped, add them to data/nav-sources.json`);

  const navs = payload.navs
    .filter((n) => byPageSlug.has(n.fund))
    .map((n) => ({ ...n, fund: byPageSlug.get(n.fund)!.slug }));
  const dividends = payload.dividends
    .filter((d) => byDivKey.has(d.fund))
    .map((d) => ({ ...d, fund: byDivKey.get(d.fund)!.slug }));

  const { rows } = fundRowsFor("shanta", new Set(payload.fundSlugs), roster);
  const incoming: IncomingFile = { funds: rows, history: navs, dividends };
  const file = path.join(INCOMING_DIR, "shanta.json");
  fs.writeFileSync(file, `${JSON.stringify(incoming, null, 2)}\n`);

  const benchDetail = updateDseBenchmarks(payload.dse);
  console.log(`  ${benchDetail}`);

  const perFund = [...new Set(navs.map((n) => n.fund))];
  return {
    source: "shanta",
    navRows: navs.length,
    dividendRows: dividends.length,
    funds: perFund.length,
    detail: benchDetail,
  };
}

async function fetchIdlc(roster: Roster | null, noCache: boolean): Promise<FetchResult> {
  console.log("→ IDLC AML: historic NAV endpoint…");
  const sources = loadSources();
  const idlcFunds = sources.funds.filter((f) => f.sources.idlc);
  if (!idlcFunds.length) throw new Error("No IDLC funds configured in data/nav-sources.json");

  const navs: NavRow[] = [];
  for (const fund of idlcFunds) {
    const key = fund.sources.idlc!.key;
    const html = await politeFetch("https://idlc.com/aml/admin/ajax_handle.php", {
      method: "POST",
      body: new URLSearchParams({
        request_type: "historic_nav",
        fundID: key,
        fromDate: "2000-01-01",
        toDate: todayISO(),
      }).toString(),
      cacheKey: `idlc-fund-${key}.html`,
      noCache,
    });
    const parsed = parseIdlcTable(html);
    const seen = new Set<string>();
    for (const row of parsed) {
      if (seen.has(row.date)) continue;
      seen.add(row.date);
      navs.push({ fund: fund.slug, date: row.date, nav: row.nav });
    }
    console.log(`  ${fund.name}: ${seen.size} NAV rows`);
  }

  const { rows } = fundRowsFor("idlc", new Set(), roster);
  const incoming: IncomingFile = { funds: rows, history: navs, dividends: [] };
  fs.writeFileSync(path.join(INCOMING_DIR, "idlc.json"), `${JSON.stringify(incoming, null, 2)}\n`);

  return { source: "idlc", navRows: navs.length, dividendRows: 0, funds: idlcFunds.length, detail: "Dividend history not published by this endpoint yet." };
}

async function main() {
  const args = process.argv.slice(2);
  const noCache = args.includes("--no-cache");
  const onlyArg = args.find((a) => a.startsWith("--only="));
  const only = onlyArg ? onlyArg.slice(7).split(",").map((s) => s.trim()) : null;

  fs.mkdirSync(INCOMING_DIR, { recursive: true });
  loadSources(); // fail fast if the registry is broken

  let roster: Roster | null = null;
  if (!only || only.includes("lankabd")) {
    roster = await fetchLankabdRoster(noCache);
    fs.writeFileSync(
      ROSTER_FILE,
      `${JSON.stringify({ schemaVersion: 1, asOf: roster.asOf, fetchedAt: new Date().toISOString(), fundCount: roster.funds.length, funds: roster.funds }, null, 2)}\n`
    );
    console.log(`  wrote data/market-roster.json`);
  } else if (fs.existsSync(ROSTER_FILE)) {
    roster = JSON.parse(fs.readFileSync(ROSTER_FILE, "utf8")) as Roster;
  }

  const results: FetchResult[] = [];
  if (!only || only.includes("shanta")) results.push(await fetchShanta(roster, noCache));
  if (!only || only.includes("idlc")) results.push(await fetchIdlc(roster, noCache));
  if (!only || only.includes("edge")) results.push(await fetchEdge(roster, noCache));
  if (!only || only.includes("lbaml")) results.push(await fetchLankabangla(roster, noCache));

  console.log("\nFetch summary");
  for (const r of results) {
    console.log(`  ${r.source}: ${r.funds} funds · ${r.navRows} NAV rows · ${r.dividendRows} dividend rows — ${r.detail}`);
  }
  console.log("\nNext: npm run data:import -- data/incoming\n");
}

const invokedDirectly = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url : false;
if (invokedDirectly) {
  main().catch((error) => {
    console.error(`\n✖ Fetch failed: ${error instanceof Error ? error.message : String(error)}\n`);
    process.exit(1);
  });
}
