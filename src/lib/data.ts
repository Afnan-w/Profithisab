import fs from "node:fs";
import path from "node:path";
import {
  amcsFileSchema,
  benchmarksFileSchema,
  dividendsFileSchema,
  fundsFileSchema,
  licenseSchema,
  metaSchema,
  navRowSchema,
  parseOrThrow,
  verificationFileSchema,
  approvedFileSchema,
  reviewFileSchema,
  type BenchmarkRecord,
  type MetaRecord,
  type NavRow,
  type ReviewItem,
  type VerificationEntry,
} from "@/lib/schema";
import { parseCsvObjects } from "@/lib/csv";
import { daysBetween, isValidISODate, todayISO } from "@/lib/date";
import { STALE_AFTER_DAYS } from "@/lib/config";
import type { Completeness, Fund, FundSource, NavPoint } from "@/lib/types";

/**
 * Server-only data gateway. Reads committed JSON/CSV from /data at build time.
 * Every file is validated with Zod; a bad file stops `npm run build`.
 */

const ROOT = process.cwd();
const DATA_DIR = path.join(ROOT, "data");

function readText(file: string): string {
  try {
    return fs.readFileSync(file, "utf8");
  } catch {
    throw new Error(`Missing data file: ${path.relative(ROOT, file)}. See DATA-GUIDE.md.`);
  }
}

function readJson(file: string): unknown {
  const text = readText(file);
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(`${path.relative(ROOT, file)} is not valid JSON. Check for a missing comma or trailing text.`);
  }
}

function readNavFile(file: string): NavRow[] {
  if (!fs.existsSync(file)) return [];
  const rows = parseCsvObjects(readText(file)).map((r, idx) => {
    const date = (r.date || r.Date || "").trim();
    const rawNav = (r.nav ?? r.NAV ?? "").toString().replace(/,/g, "").trim();
    const nav = Number(rawNav);
    return { date, nav, idx };
  });
  if (!rows.length) return [];

  const bad: string[] = [];
  const seen = new Set<string>();
  for (const r of rows) {
    if (!isValidISODate(r.date)) bad.push(`row ${r.idx + 2}: date "${r.date}" is not YYYY-MM-DD`);
    if (!isFinite(r.nav) || r.nav <= 0) bad.push(`row ${r.idx + 2}: NAV "${r.nav}" must be greater than zero`);
    if (seen.has(r.date)) bad.push(`row ${r.idx + 2}: duplicate date ${r.date}`);
    seen.add(r.date);
  }
  if (bad.length) throw new Error(`${path.relative(ROOT, file)} is invalid:\n  • ${bad.join("\n  • ")}`);

  return rows
    .map((r) => parseOrThrow(navRowSchema, { date: r.date, nav: r.nav }, `${path.relative(ROOT, file)} row ${r.idx + 2}`))
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
}

function monthlyPoints(nav: NavRow[], dividends: Array<{ recordDate: string; amount: number }>): NavPoint[] {
  const out: NavPoint[] = [];
  for (const row of nav) {
    const key = row.date.slice(0, 7);
    const prev = out[out.length - 1];
    if (prev && prev.m === key) out[out.length - 1] = { m: key, nav: row.nav, div: prev.div };
    else out.push({ m: key, nav: row.nav, div: 0 });
  }
  const byMonth = new Map<string, number>();
  for (const d of dividends) {
    const key = d.recordDate.slice(0, 7);
    byMonth.set(key, (byMonth.get(key) ?? 0) + d.amount);
  }
  return out.map((p) => ({ ...p, div: Number((byMonth.get(p.m) ?? 0).toFixed(4)) }));
}

function nearestNavDays(nav: NavRow[], date: string): number {
  if (!nav.length) return Number.POSITIVE_INFINITY;
  let best = Number.POSITIVE_INFINITY;
  for (const row of nav) {
    best = Math.min(best, Math.abs(daysBetween(row.date, date)));
    if (row.date > date && best <= 1) break;
  }
  return best;
}

export interface Dataset {
  funds: Fund[];
  amcs: Array<{ id: string; name: string; shortName: string; website: string | null }>;
  benchmarks: BenchmarkRecord[];
  license: ReturnType<typeof licenseSchema.parse>;
  verification: VerificationEntry[];
  review: ReviewItem[];
  meta: MetaRecord;
  isDemo: boolean;
  dataDir: string;
  /** Attribution that is safe to display (real data + licence text only). */
  attribution: { text: string; url: string | null } | null;
}

let cache: Dataset | null = null;

export function getDataset(): Dataset {
  if (cache) return cache;

  const license = parseOrThrow(licenseSchema, readJson(path.join(DATA_DIR, "license.json")), "data/license.json");
  const verification = parseOrThrow(
    verificationFileSchema,
    readJson(path.join(DATA_DIR, "verification.json")),
    "data/verification.json"
  ).verification;
  const review = fs.existsSync(path.join(DATA_DIR, "review-needed.json"))
    ? parseOrThrow(
        reviewFileSchema,
        readJson(path.join(DATA_DIR, "review-needed.json")),
        "data/review-needed.json"
      ).items
    : [];
  const approvedRaw = fs.existsSync(path.join(DATA_DIR, "approved-deviations.json"))
    ? parseOrThrow(
        approvedFileSchema,
        readJson(path.join(DATA_DIR, "approved-deviations.json")),
        "data/approved-deviations.json"
      ).approved
    : [];
  const benchmarks = parseOrThrow(
    benchmarksFileSchema,
    readJson(path.join(DATA_DIR, "benchmarks.json")),
    "data/benchmarks.json"
  ).benchmarks;
  const amcsFile = parseOrThrow(amcsFileSchema, readJson(path.join(DATA_DIR, "amcs.json")), "data/amcs.json");

  // Real data wins. When no real funds exist yet we load the clearly-labelled demo set.
  const realFundsFile = parseOrThrow(fundsFileSchema, readJson(path.join(DATA_DIR, "funds.json")), "data/funds.json");
  const isDemo = realFundsFile.funds.length === 0;
  const baseDir = isDemo ? path.join(DATA_DIR, "demo") : DATA_DIR;
  const fundsFile = isDemo
    ? parseOrThrow(fundsFileSchema, readJson(path.join(baseDir, "funds.json")), "data/demo/funds.json")
    : realFundsFile;

  const storedMeta = fs.existsSync(path.join(DATA_DIR, "meta.json"))
    ? parseOrThrow(metaSchema, readJson(path.join(DATA_DIR, "meta.json")), "data/meta.json")
    : null;

  const amcById = new Map(amcsFile.amcs.map((a) => [a.id, a]));
  const verificationById = new Map(verification.map((v) => [v.fundId, v]));
  const approvedByFund = new Map<string, Set<string>>();
  for (const a of approvedRaw) {
    if (!approvedByFund.has(a.fundId)) approvedByFund.set(a.fundId, new Set());
    approvedByFund.get(a.fundId)!.add(a.date);
  }
  const today = todayISO();
  const now = Date.now();

  const funds: Fund[] = fundsFile.funds.map((record) => {
    const navFile = path.join(baseDir, "nav", `${record.slug}.csv`);
    const divFile = path.join(baseDir, "dividends", `${record.slug}.json`);
    const nav = readNavFile(navFile);
    const dividends = fs.existsSync(divFile)
      ? parseOrThrow(
          dividendsFileSchema,
          readJson(divFile),
          path.relative(ROOT, divFile)
        ).dividends
      : [];

    const future = nav.filter((r) => r.date > today);
    if (future.length) {
      throw new Error(`${path.relative(ROOT, navFile)} contains future dates (${future[0].date}). Future NAVs cannot be published.`);
    }
    for (const d of dividends) {
      if (d.recordDate > today) throw new Error(`${path.relative(ROOT, divFile)} has a future dividend date (${d.recordDate}).`);
      if (nav.length && nearestNavDays(nav, d.recordDate) > 10) {
        throw new Error(
          `${path.relative(ROOT, divFile)}: dividend ${d.recordDate} is more than 10 days from any NAV date. Fix the record date or move it to data/review-needed.json.`
        );
      }
    }

    // Safe-by-default suspicious-move check (imported data only; demo is generated).
    // NAV legitimately differs across a publishing gap, so the check only applies
    // between consecutive published dates (long gaps are warned about in data:check).
    if (!isDemo && nav.length > 1) {
      const approved = approvedByFund.get(record.id) ?? new Set<string>();
      for (let i = 1; i < nav.length; i++) {
        const jump = nav[i].nav / nav[i - 1].nav - 1;
        if (Math.abs(jump) > 0.15 && daysBetween(nav[i - 1].date, nav[i].date) <= 35 && !approved.has(nav[i].date)) {
          throw new Error(
            `${path.relative(ROOT, navFile)}: ${nav[i].date} moves ${(jump * 100).toFixed(1)}% in one step. ` +
              `Approve it with "npm run data:approve" (or remove the row) before it can be published.`
          );
        }
      }
    }

    const latest = nav.length ? nav[nav.length - 1].date : null;
    const stale = latest ? daysBetween(latest, today) > STALE_AFTER_DAYS : true;
    const amc = amcById.get(record.amcId);
    const source: FundSource = record.source;
    const verified = Boolean(license.displayVerification && verificationById.get(record.id));

    let completeness: Completeness = "partial";
    if (!nav.length) completeness = "missing";
    else if (
      nav.length >= 2 &&
      record.fee !== null &&
      record.fundSize !== null &&
      record.launchDate !== null &&
      !stale
    ) {
      completeness = "complete";
    }

    return {
      ...record,
      amc: amc?.shortName ?? record.amcId,
      amcSlug: record.amcId,
      inception: record.launchDate ? record.launchDate.slice(0, 7) : null,
      minTaka: record.minInvestment ?? null,
      verified,
      source,
      completeness,
      isStale: stale,
      latestNavDate: latest,
      nav,
      dividends,
      series: monthlyPoints(nav, dividends),
    };
  });

  const latestNavDate = funds
    .map((f) => f.latestNavDate)
    .filter((d): d is string => Boolean(d))
    .sort()
    .at(-1) ?? null;

  const counts = {
    funds: funds.length,
    amcs: amcsFile.amcs.length,
    withNav: funds.filter((f) => f.nav.length > 0).length,
    complete: funds.filter((f) => f.completeness === "complete").length,
    partial: funds.filter((f) => f.completeness === "partial").length,
    missing: funds.filter((f) => f.completeness === "missing").length,
    stale: funds.filter((f) => f.isStale).length,
    verified: funds.filter((f) => f.verified).length,
  };

  const meta: MetaRecord = {
    generatedAt: new Date(now).toISOString(),
    lastUpdated: storedMeta?.lastUpdated ?? today,
    latestNavDate,
    isDemo,
    sourceName: isDemo
      ? "Demo dataset — generated for layout testing, not published NAV history"
      : license.sourceName || "Unnamed data source",
    counts,
    perFund: funds.map((f) => ({
      id: f.id,
      slug: f.slug,
      latestNavDate: f.latestNavDate,
      completeness: f.completeness,
      rows: f.nav.length,
      stale: f.isStale,
      source: f.source.name,
    })),
  };

  const attribution =
    !isDemo && license.attributionText.trim()
      ? { text: license.attributionText.trim(), url: license.attributionUrl ?? null }
      : null;

  cache = {
    funds,
    amcs: amcsFile.amcs,
    benchmarks,
    license,
    verification,
    review,
    meta,
    isDemo,
    dataDir: baseDir,
    attribution,
  };
  return cache;
}

export function benchmarkBySlug(slug: string): BenchmarkRecord | undefined {
  return getDataset().benchmarks.find((b) => b.id === slug);
}

export function availableBenchmarks(): BenchmarkRecord[] {
  return getDataset().benchmarks.filter((b) => b.status !== "unavailable" && b.annualRate !== null);
}

/** For scripts that run after writing files. */
export function clearDataCache(): void {
  cache = null;
}

export { DATA_DIR, ROOT };
