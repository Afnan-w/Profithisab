import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { readXlsxFile, readSheetNames } from "read-excel-file/node";
import { parseCsvObjects, toCsv } from "../src/lib/csv";
import {
  amcsFileSchema,
  approvedFileSchema,
  dividendsFileSchema,
  fundsFileSchema,
  licenseSchema,
  parseOrThrow,
  reviewFileSchema,
  type FundRecord,
  type ReviewItem,
} from "../src/lib/schema";
import { getDataset, clearDataCache, ROOT, DATA_DIR } from "../src/lib/data";
import { daysBetween, isValidISODate, toISO, todayISO } from "../src/lib/date";
import { suspiciousJump } from "../src/lib/calc";
import type { NavRow } from "../src/lib/types";

/**
 * `npm run data:import -- <file-or-folder> [--dry-run]`
 *
 * Reads the founder's export (CSV / JSON / XLSX), maps its columns to our
 * structure, merges (never deletes) NAV history, and sends suspicious rows to
 * data/review-needed.json instead of publishing them.
 */

type Row = Record<string, unknown>;

interface Table {
  name: string;
  headers: string[];
  rows: Row[];
}

interface MapSet {
  fund: string | null;
  slug: string | null;
  name: string | null;
  acronym: string | null;
  date: string | null;
  nav: string | null;
  dividend: string | null;
  amount: string | null;
  amc: string | null;
  type: string | null;
  shariah: string | null;
  fee: string | null;
  fundSize: string | null;
  launchDate: string | null;
  minInvestment: string | null;
}

const ALIASES: Record<keyof MapSet, string[]> = {
  fund: ["fund", "fundid", "fundname", "fundslug", "slug", "scheme", "schemename", "fundcode", "code"],
  slug: ["slug", "fundslug", "fundid"],
  name: ["name", "fundname", "schemename"],
  acronym: ["acronym", "ticker", "shortname", "symbol"],
  date: ["date", "navdate", "asof", "asofdate", "day", "recorddate", "dividenddate"],
  nav: ["nav", "navperunit", "navbdt", "unitprice", "price", "closingnav", "navvalue"],
  dividend: ["dividend", "div", "cashdividend", "dividendperunit", "dividendamount"],
  amount: ["amount", "dividendamount", "cashdividend", "dividendperunit", "payout"],
  amc: ["amc", "amcid", "assetmanager", "fundmanager", "manager"],
  type: ["type", "fundtype", "category"],
  shariah: ["shariah", "islamic", "halal", "shariahcompliant"],
  fee: ["fee", "feepct", "expenseratio", "annualfee", "managementfee", "ter"],
  fundSize: ["fundsize", "aum", "aumcr", "assets", "netassets", "size", "fundsizecr", "aumcrore"],
  launchDate: ["launchdate", "inception", "inceptiondate", "launch", "startdate"],
  minInvestment: ["mininvestment", "minimum", "minimuminvestment", "minamount"],
};

const OVERRIDES_FILE = path.join(DATA_DIR, "import-map.json");

function norm(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function titleCase(s: string): string {
  return s
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

function loadOverrides(): Partial<Record<keyof MapSet, string>> {
  if (!fs.existsSync(OVERRIDES_FILE)) return {};
  try {
    const raw = JSON.parse(fs.readFileSync(OVERRIDES_FILE, "utf8")) as Record<string, string>;
    return raw as Partial<Record<keyof MapSet, string>>;
  } catch {
    throw new Error("data/import-map.json is not valid JSON. Fix it or delete it to use auto-detection.");
  }
}

export function buildMapping(headers: string[], overrides: Partial<Record<keyof MapSet, string>> = {}): MapSet {
  const byNorm = new Map(headers.map((h) => [norm(h), h]));
  const map = {} as MapSet;
  for (const field of Object.keys(ALIASES) as Array<keyof MapSet>) {
    const override = overrides[field];
    if (override && headers.includes(override)) {
      map[field] = override;
      continue;
    }
    const hit = ALIASES[field].find((alias) => byNorm.has(alias));
    map[field] = hit ? byNorm.get(hit)! : null;
  }
  return map;
}

/* ── Value parsing ────────────────────────────────────────────────────────── */

export function parseNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const s = String(value).replace(/[,৳$%\s]/g, "").trim();
  if (!s) return null;
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}

const MONTH_NAMES = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];

/** Strict-ish date parser. Ambiguous slash dates are read day-first (documented). */
export function parseDateValue(value: unknown): string | null {
  if (value === null || value === undefined || value === "") return null;
  if (value instanceof Date && !Number.isNaN(value.getTime())) return toISO(value);
  if (typeof value === "number" && value > 20000 && value < 80000) {
    // Excel serial date
    const ms = Date.UTC(1899, 11, 30) + Math.round(value) * 86_400_000;
    return toISO(new Date(ms));
  }
  const s = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    const iso = s.slice(0, 10);
    return isValidISODate(iso) ? iso : null;
  }
  const slash = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
  if (slash) {
    const day = Number(slash[1]);
    const month = Number(slash[2]);
    const year = Number(slash[3]);
    const iso = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    return isValidISODate(iso) ? iso : null;
  }
  const named = s.match(/^(\d{1,2})[-\s]([A-Za-z]{3,})[-\s](\d{2,4})$/);
  if (named) {
    const day = Number(named[1]);
    const mi = MONTH_NAMES.indexOf(named[2].slice(0, 3).toLowerCase());
    let year = Number(named[3]);
    if (year < 100) year += 2000;
    if (mi >= 0) {
      const iso = `${year}-${String(mi + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      return isValidISODate(iso) ? iso : null;
    }
  }
  if (/^\d{4}\/\d{1,2}\/\d{1,2}$/.test(s)) {
    const [y, m, d] = s.split("/").map(Number);
    const iso = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    return isValidISODate(iso) ? iso : null;
  }
  return null;
}

export function parseBool(value: unknown): boolean | null {
  if (typeof value === "boolean") return value;
  if (value === null || value === undefined) return null;
  const s = String(value).trim().toLowerCase();
  if (["true", "yes", "y", "1", "shariah", "shariah-compliant", "halal", "islamic"].includes(s)) return true;
  if (["false", "no", "n", "0", "conventional", "non-shariah", "non shariah"].includes(s)) return false;
  return null;
}

export function parseFundType(value: unknown): FundRecord["type"] | null {
  if (value === null || value === undefined) return null;
  const s = String(value).trim().toLowerCase();
  if (["growth", "equity", "equity fund"].includes(s)) return "growth";
  if (["balanced", "mixed", "hybrid", "balanced fund"].includes(s)) return "balanced";
  if (["income", "fixed income", "fixed-income", "debt", "bond", "money market"].includes(s)) return "income";
  return null;
}

function isDateHeader(h: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(h) || /^\d{1,2}[/-]\d{1,2}[/-]\d{4}$/.test(h);
}

/* ── Input readers ────────────────────────────────────────────────────────── */

function rowsToTable(name: string, rows: unknown[][]): Table | null {
  const clean = rows.filter((r) => r.some((c) => c !== null && c !== undefined && String(c).trim() !== ""));
  if (clean.length < 2) return null;
  const headers = clean[0].map((h) => String(h ?? "").trim());
  const body = clean.slice(1).map((r) => {
    const obj: Row = {};
    headers.forEach((h, i) => {
      if (h) obj[h] = r[i] ?? null;
    });
    return obj;
  });
  return { name, headers, rows: body };
}

function jsonToTables(value: unknown, name: string): Table[] {
  const out: Table[] = [];
  if (Array.isArray(value)) {
    const rows = value.filter((r) => r && typeof r === "object") as Row[];
    if (rows.length) out.push({ name, headers: Object.keys(rows[0]), rows });
    return out;
  }
  if (!value || typeof value !== "object") return out;
  const obj = value as Record<string, unknown>;
  if (Array.isArray(obj.funds)) {
    const rows = obj.funds.filter((r) => r && typeof r === "object") as Row[];
    if (rows.length) out.push({ name: `${name}:funds`, headers: Object.keys(rows[0]), rows });
  }
  for (const key of ["nav", "rows", "data", "navs", "history"]) {
    if (Array.isArray(obj[key])) {
      const rows = (obj[key] as unknown[]).filter((r) => r && typeof r === "object") as Row[];
      if (rows.length) out.push({ name: `${name}:${key}`, headers: Object.keys(rows[0]), rows });
    }
  }
  if (Array.isArray(obj.dividends)) {
    const rows = (obj.dividends as unknown[]).filter((r) => r && typeof r === "object") as Row[];
    if (rows.length) out.push({ name: `${name}:dividends`, headers: Object.keys(rows[0]), rows });
  }
  return out;
}

async function readFileTables(file: string): Promise<Table[]> {
  const ext = path.extname(file).toLowerCase();
  const base = path.basename(file).replace(ext, "");
  if (ext === ".csv") {
    return [{ name: base, headers: [], rows: parseCsvObjects(fs.readFileSync(file, "utf8")) }].map((t) => ({
      ...t,
      headers: t.rows.length ? Object.keys(t.rows[0]) : [],
    }));
  }
  if (ext === ".json") {
    const value = JSON.parse(fs.readFileSync(file, "utf8"));
    return jsonToTables(value, base);
  }
  if (ext === ".xlsx") {
    const buffer = fs.readFileSync(file);
    const sheets = await readSheetNames(buffer);
    const tables: Table[] = [];
    for (const sheet of sheets) {
      const rows = (await readXlsxFile(buffer, { sheet })) as unknown[][];
      const t = rowsToTable(`${base}:${sheet}`, rows);
      if (t) tables.push(t);
    }
    return tables;
  }
  throw new Error(`Unsupported file type: ${ext}. Use CSV, JSON or XLSX.`);
}

async function collectTables(inputPath: string): Promise<Table[]> {
  const stat = fs.statSync(inputPath);
  if (stat.isDirectory()) {
    const files = fs
      .readdirSync(inputPath)
      .filter((f) => /\.(csv|json|xlsx)$/i.test(f))
      .map((f) => path.join(inputPath, f));
    const tables: Table[] = [];
    for (const f of files) tables.push(...(await readFileTables(f)));
    return tables;
  }
  return readFileTables(inputPath);
}

/* ── Fund metadata ────────────────────────────────────────────────────────── */

function rowGet(row: Row, column: string | null): unknown {
  return column ? row[column] : null;
}

interface WorkingFund {
  record: FundRecord;
  isNew: boolean;
}

function fundKey(row: Row, map: MapSet): string | null {
  const raw = rowGet(row, map.slug) ?? rowGet(row, map.fund) ?? rowGet(row, map.name);
  if (raw === null || raw === undefined || String(raw).trim() === "") return null;
  return String(raw).trim();
}

function existingIndex(funds: FundRecord[]) {
  const bySlug = new Map<string, FundRecord>();
  const byName = new Map<string, FundRecord>();
  for (const f of funds) {
    bySlug.set(f.slug, f);
    bySlug.set(f.id, f);
    byName.set(f.name.trim().toLowerCase(), f);
    byName.set(f.acronym.trim().toLowerCase(), f);
  }
  return { bySlug, byName };
}

function mergeRecord(existing: FundRecord, incoming: Partial<FundRecord>): FundRecord {
  return {
    ...existing,
    name: incoming.name?.trim() || existing.name,
    acronym: incoming.acronym?.trim() || existing.acronym,
    amcId: incoming.amcId || existing.amcId,
    type: incoming.type ?? existing.type,
    shariah: incoming.shariah ?? existing.shariah,
    launchDate: existing.launchDate ?? incoming.launchDate ?? null,
    fee: incoming.fee ?? existing.fee,
    fundSize: incoming.fundSize ?? existing.fundSize,
    minInvestment: incoming.minInvestment ?? existing.minInvestment ?? 5000,
    source: existing.source.kind === "demo" ? incoming.source ?? existing.source : existing.source,
    notes: incoming.notes ?? existing.notes,
  };
}

/* ── Main ─────────────────────────────────────────────────────────────────── */

interface ImportStats {
  navAdded: number;
  navUnchanged: number;
  navReview: number;
  divAdded: number;
  fundsNew: number;
  fundsUpdated: number;
  review: ReviewItem[];
  mapping: MapSet;
  input: string;
}

interface Args {
  input: string;
  dryRun: boolean;
}

function parseArgs(argv: string[]): Args {
  const args = argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const input = args.find((a) => !a.startsWith("--"));
  if (!input) {
    console.error("Usage: npm run data:import -- <file-or-folder> [--dry-run]");
    process.exit(1);
  }
  return { input: path.resolve(input), dryRun };
}

function backupData(): string {
  const stamp = Date.now();
  const dir = path.join(ROOT, ".data-backup", String(stamp));
  fs.mkdirSync(dir, { recursive: true });
  for (const entry of ["funds.json", "amcs.json", "nav", "dividends"]) {
    const src = path.join(DATA_DIR, entry);
    if (fs.existsSync(src)) fs.cpSync(src, path.join(dir, entry), { recursive: true });
  }
  return dir;
}

function restoreData(backup: string): void {
  for (const entry of ["funds.json", "amcs.json", "nav", "dividends"]) {
    const dst = path.join(DATA_DIR, entry);
    const src = path.join(backup, entry);
    if (fs.existsSync(dst)) fs.rmSync(dst, { recursive: true, force: true });
    if (fs.existsSync(src)) fs.cpSync(src, path.join(DATA_DIR, entry), { recursive: true });
  }
}

function appendRunLog(lines: string[]): void {
  const file = path.join(ROOT, "scripts", "last-run.md");
  const header = fs.existsSync(file) ? "" : "# Import changelog\n\nEach import appends a dated entry here. Old entries are never deleted.\n";
  const text = `${header}\n## ${new Date().toISOString()} — ${lines[0]}\n\n${lines.slice(1).join("\n")}\n`;
  fs.appendFileSync(file, text);
}

async function main() {
  const { input, dryRun } = parseArgs(process.argv);
  if (!fs.existsSync(input)) {
    console.error(`Cannot find: ${input}`);
    process.exit(1);
  }

  const license = parseOrThrow(licenseSchema, JSON.parse(fs.readFileSync(path.join(DATA_DIR, "license.json"), "utf8")), "data/license.json");
  if (!dryRun && (!license.permissionDate.trim() || !license.attributionText.trim())) {
    console.error(
      "\n✖ Import stopped: data/license.json is not filled in.\n" +
        "  Fill permissionDate and attributionText (and permitted[]) before the first import.\n" +
        "  Run with --dry-run to inspect the column mapping without writing anything.\n"
    );
    process.exit(1);
  }

  const fundsFileRaw = JSON.parse(fs.readFileSync(path.join(DATA_DIR, "funds.json"), "utf8"));
  const fundsFile = parseOrThrow(fundsFileSchema, fundsFileRaw, "data/funds.json");
  const amcsFile = parseOrThrow(
    amcsFileSchema,
    JSON.parse(fs.readFileSync(path.join(DATA_DIR, "amcs.json"), "utf8")),
    "data/amcs.json"
  );

  const tables = await collectTables(input);
  if (!tables.length) throw new Error("No readable tables found in the export.");

  const overrides = loadOverrides();
  let mapping = buildMapping(tables[0].headers, overrides);

  const workingFunds = new Map<string, WorkingFund>();
  for (const f of fundsFile.funds) workingFunds.set(f.slug, { record: f, isNew: false });
  const index = existingIndex([...workingFunds.values()].map((w) => w.record));
  const amcs = new Map(amcsFile.amcs.map((a) => [a.id, a]));
  const review: ReviewItem[] = [];
  const stats: ImportStats = {
    navAdded: 0,
    navUnchanged: 0,
    navReview: 0,
    divAdded: 0,
    fundsNew: 0,
    fundsUpdated: 0,
    review,
    mapping,
    input,
  };

  const today = todayISO();
  const source = {
    name: license.sourceName || "Imported export",
    url: license.sourceUrl ?? null,
    asOf: today,
    kind: license.automatedFetching ? ("public-disclosure" as const) : ("export" as const),
  };

  function ensureFund(row: Row, table: Table, rowNo: number): FundRecord | null {
    const key = fundKey(row, mapping);
    if (!key) {
      review.push({ file: table.name, row: rowNo, reason: "No fund name/slug in this row.", raw: { row } });
      return null;
    }
    const slug = slugify(rowGet(row, mapping.slug) ? String(rowGet(row, mapping.slug)) : key);
    const found = index.bySlug.get(slug) ?? index.bySlug.get(key) ?? index.byName.get(key.toLowerCase());
    if (found) {
      const w = workingFunds.get(found.slug)!;
      return w.record;
    }

    const name = String(rowGet(row, mapping.name) ?? key).trim() || titleCase(slug);
    const type = parseFundType(rowGet(row, mapping.type));
    const shariah = parseBool(rowGet(row, mapping.shariah));
    if (type === null || shariah === null) {
      review.push({
        file: table.name,
        row: rowNo,
        reason: `New fund "${name}" needs type (growth/balanced/income) and shariah (true/false) columns before it can be published.`,
        raw: { fund: name, row },
      });
      return null;
    }
    const amcRaw = String(rowGet(row, mapping.amc) ?? "Unspecified").trim() || "Unspecified";
    const amcId = slugify(amcRaw);
    if (!amcs.has(amcId)) amcs.set(amcId, { id: amcId, name: amcRaw, shortName: amcRaw, website: null });
    const fund: FundRecord = {
      id: slug,
      slug,
      name,
      acronym: String(rowGet(row, mapping.acronym) ?? name.split(/\s+/).map((s) => s[0]).join("").slice(0, 8).toUpperCase()).trim(),
      amcId,
      type,
      shariah,
      launchDate: parseDateValue(rowGet(row, mapping.launchDate)),
      fee: parseNumber(rowGet(row, mapping.fee)),
      fundSize: parseNumber(rowGet(row, mapping.fundSize)),
      minInvestment: parseNumber(rowGet(row, mapping.minInvestment)) ?? 5000,
      source,
      notes: undefined,
    };
    workingFunds.set(slug, { record: fund, isNew: true });
    index.bySlug.set(slug, fund);
    index.byName.set(name.toLowerCase(), fund);
    stats.fundsNew += 1;
    return fund;
  }

  // Pass 1: catalog-shaped tables.
  for (const table of tables) {
    mapping = buildMapping(table.headers, overrides);
    const isCatalog =
      /fund|scheme|catalog/i.test(table.name) ||
      (table.headers.some((h) => ALIASES.name.includes(norm(h))) &&
        table.headers.some((h) => ALIASES.type.includes(norm(h)) || ALIASES.shariah.includes(norm(h))) &&
        !table.headers.some((h) => ALIASES.nav.includes(norm(h))));
    if (!isCatalog) continue;
    table.rows.forEach((row, i) => {
      const before = workingFunds.size;
      const fund = ensureFund(row, table, i + 2);
      if (!fund) return;
      const w = workingFunds.get(fund.slug);
      if (!w) return;
      const merged = mergeRecord(w.record, {
        name: rowGet(row, mapping.name) ? String(rowGet(row, mapping.name)) : undefined,
        acronym: rowGet(row, mapping.acronym) ? String(rowGet(row, mapping.acronym)) : undefined,
        amcId: rowGet(row, mapping.amc) ? slugify(String(rowGet(row, mapping.amc))) : undefined,
        type: parseFundType(rowGet(row, mapping.type)) ?? undefined,
        shariah: parseBool(rowGet(row, mapping.shariah)) ?? undefined,
        launchDate: parseDateValue(rowGet(row, mapping.launchDate)),
        fee: parseNumber(rowGet(row, mapping.fee)),
        fundSize: parseNumber(rowGet(row, mapping.fundSize)),
        minInvestment: parseNumber(rowGet(row, mapping.minInvestment)),
        source,
      });
      w.record = merged;
      if (workingFunds.size === before && !w.isNew) stats.fundsUpdated += 1;
      if (rowGet(row, mapping.amc)) {
        const amcRaw = String(rowGet(row, mapping.amc));
        const id = slugify(amcRaw);
        if (!amcs.has(id)) amcs.set(id, { id, name: amcRaw, shortName: amcRaw, website: null });
      }
    });
  }

  // Pass 2: NAV + embedded dividends, plus dividend-only tables.
  const navByFund = new Map<string, Map<string, number>>();
  const divByFund = new Map<string, Map<string, number>>();
  const loadExisting = (slug: string) => {
    if (!navByFund.has(slug)) {
      const file = path.join(DATA_DIR, "nav", `${slug}.csv`);
      const map = new Map<string, number>();
      if (fs.existsSync(file)) {
        for (const r of parseCsvObjects(fs.readFileSync(file, "utf8"))) {
          const date = parseDateValue(r.date);
          const nav = parseNumber(r.nav);
          if (date && nav && nav > 0) map.set(date, nav);
        }
      }
      navByFund.set(slug, map);
    }
    if (!divByFund.has(slug)) {
      const file = path.join(DATA_DIR, "dividends", `${slug}.json`);
      const map = new Map<string, number>();
      if (fs.existsSync(file)) {
        try {
          const parsed = dividendsFileSchema.parse(JSON.parse(fs.readFileSync(file, "utf8")));
          for (const d of parsed.dividends) map.set(d.recordDate, d.amount);
        } catch {
          /* handled by data:check */
        }
      }
      divByFund.set(slug, map);
    }
  };

  for (const table of tables) {
    mapping = buildMapping(table.headers, overrides);
    const isDividendOnly =
      /div/i.test(table.name) ||
      (table.headers.some((h) => /recorddate|dividenddate/i.test(h)) &&
        !table.headers.some((h) => ALIASES.nav.includes(norm(h))));
    const hasNav = table.headers.some((h) => ALIASES.nav.includes(norm(h)));

    // Wide format: fund + dated columns.
    const dateCols = table.headers.filter(isDateHeader);
    if (!hasNav && dateCols.length >= 2 && table.headers.some((h) => ALIASES.fund.includes(norm(h)))) {
      table.rows.forEach((row, i) => {
        const fund = ensureFund(row, table, i + 2);
        if (!fund) return;
        loadExisting(fund.slug);
        for (const col of dateCols) {
          const nav = parseNumber(row[col]);
          if (nav === null) continue;
          const date = parseDateValue(col);
          if (!date) continue;
          if (date > today) review.push({ file: table.name, row: i + 2, reason: `Future date ${date}.`, raw: { fund: fund.slug, date, nav } });
          else if (nav <= 0) review.push({ file: table.name, row: i + 2, reason: `NAV ${nav} is not positive.`, raw: { fund: fund.slug, date, nav } });
          else {
            const map = navByFund.get(fund.slug)!;
            if (!map.has(date)) {
              map.set(date, nav);
              stats.navAdded += 1;
            } else stats.navUnchanged += 1;
          }
        }
      });
      continue;
    }

    if (!hasNav && !isDividendOnly) continue;

    table.rows.forEach((row, i) => {
      const rowNo = i + 2;
      const fund = ensureFund(row, table, rowNo);
      if (!fund) return;
      loadExisting(fund.slug);
      const date = parseDateValue(rowGet(row, mapping.date));
      if (!date) {
        review.push({ file: table.name, row: rowNo, reason: "Date missing or unreadable (use YYYY-MM-DD).", raw: { row } });
        return;
      }
      if (date > today) {
        review.push({ file: table.name, row: rowNo, reason: `Future date ${date}.`, raw: { fund: fund.slug, date } });
        return;
      }

      if (hasNav) {
        const nav = parseNumber(rowGet(row, mapping.nav));
        if (nav === null || nav <= 0) {
          review.push({ file: table.name, row: rowNo, reason: `NAV missing or not positive.`, raw: { fund: fund.slug, date, nav: rowGet(row, mapping.nav) } });
        } else {
          const map = navByFund.get(fund.slug)!;
          if (map.has(date)) {
            if (Math.abs(map.get(date)! - nav) > 1e-6) {
              review.push({
                file: table.name,
                row: rowNo,
                reason: `Conflicting NAV for ${date}: existing ${map.get(date)}, export ${nav}. Kept the existing row.`,
                raw: { fund: fund.slug, date, nav },
              });
              stats.navReview += 1;
            } else stats.navUnchanged += 1;
          } else {
            map.set(date, nav);
            stats.navAdded += 1;
          }
        }
      }

      const divValue = rowGet(row, mapping.dividend) ?? (isDividendOnly ? rowGet(row, mapping.amount) : null);
      if (divValue !== null && divValue !== undefined && String(divValue).trim() !== "") {
        const amount = parseNumber(divValue);
        if (amount === null || amount <= 0) {
          review.push({ file: table.name, row: rowNo, reason: `Dividend amount missing or not positive.`, raw: { fund: fund.slug, date, amount: divValue } });
        } else {
          const map = divByFund.get(fund.slug)!;
          if (map.has(date)) {
            if (Math.abs(map.get(date)! - amount) > 1e-6) {
              review.push({
                file: table.name,
                row: rowNo,
                reason: `Conflicting dividend for ${date}: existing ${map.get(date)}, export ${amount}. Kept existing.`,
                raw: { fund: fund.slug, date, amount },
              });
            }
          } else {
            map.set(date, amount);
            stats.divAdded += 1;
          }
        }
      }
    });
  }

  // Pass 3: suspicious-move screening + dividend proximity, on the merged series.
  const approvedRaw = fs.existsSync(path.join(DATA_DIR, "approved-deviations.json"))
    ? parseOrThrow(
        approvedFileSchema,
        JSON.parse(fs.readFileSync(path.join(DATA_DIR, "approved-deviations.json"), "utf8")),
        "data/approved-deviations.json"
      ).approved
    : [];
  const approvedKeys = new Set(approvedRaw.map((a) => `${a.fundId}|${a.date}`));
  /** NAV legitimately differs across a publishing gap, so jump checks only apply
   * between consecutive published dates. Long gaps are surfaced by data:check. */
  const GAP_DAYS = 35;
  for (const [slug, navMap] of navByFund) {
    const dates = [...navMap.keys()].sort();
    let prev: NavRow | null = null;
    for (const date of dates) {
      const row: NavRow = { date, nav: navMap.get(date)! };
      if (prev && daysBetween(prev.date, date) <= GAP_DAYS && suspiciousJump(prev, row) && !approvedKeys.has(`${slug}|${date}`)) {
        review.push({
          file: "merged series",
          row: 0,
          reason: `${slug}: ${date} moves ${((row.nav / prev.nav - 1) * 100).toFixed(1)}% in one step (over 15%). Needs your approval.`,
          raw: { fund: slug, date, nav: row.nav },
        });
        navMap.delete(date);
        stats.navReview += 1;
      } else {
        prev = row;
      }
    }
  }
  for (const [slug, divMap] of divByFund) {
    const navMap = navByFund.get(slug);
    if (!navMap) continue;
    const nav = [...navMap.entries()].map(([date, n]) => ({ date, nav: n })).sort((a, b) => (a.date < b.date ? -1 : 1));
    for (const [date, amount] of divMap) {
      const nearest = nav.length ? Math.min(...nav.map((r) => Math.abs(daysBetween(r.date, date)))) : Infinity;
      if (nearest > 10) {
        review.push({
          file: "dividends",
          row: 0,
          reason: `${slug}: dividend ${date} is ${nearest} days from the nearest NAV date. Needs your approval.`,
          raw: { fund: slug, date, amount },
        });
        divMap.delete(date);
      }
    }
  }

  const finalFunds = [...workingFunds.values()].map((w) => w.record).sort((a, b) => a.name.localeCompare(b.name));
  const newFundsFile = { schemaVersion: 1 as const, funds: finalFunds };
  parseOrThrow(fundsFileSchema, newFundsFile, "imported funds");

  // Report before writing.
  const mappingRows = (Object.keys(mapping) as Array<keyof MapSet>)
    .filter((k) => mapping[k])
    .map((k) => `| ${k} | \`${mapping[k]}\` |`)
    .join("\n");
  const perFund = [...navByFund.entries()]
    .filter(([, m]) => m.size > 0)
    .map(([slug, m]) => `| ${slug} | ${m.size} | ${divByFund.get(slug)?.size ?? 0} |`)
    .join("\n");

  console.log(`\nInput: ${input}`);
  console.log(`Tables: ${tables.map((t) => t.name).join(", ")}`);
  console.log(`\nColumn mapping:\n${mappingRows}`);
  console.log(`\nNew funds: ${stats.fundsNew} · NAV added: ${stats.navAdded} · unchanged: ${stats.navUnchanged} · review: ${stats.navReview} · dividends added: ${stats.divAdded}`);
  console.log(`Suspicious / unreadable rows: ${review.length}`);

  if (dryRun) {
    console.log("\nDry run: no files were written.\n");
    return;
  }

  const backup = backupData();
  try {
    fs.writeFileSync(path.join(DATA_DIR, "funds.json"), `${JSON.stringify(newFundsFile, null, 2)}\n`);
    fs.writeFileSync(
      path.join(DATA_DIR, "amcs.json"),
      `${JSON.stringify({ schemaVersion: 1, amcs: [...amcs.values()].sort((a, b) => a.shortName.localeCompare(b.shortName)) }, null, 2)}\n`
    );

    for (const [slug, map] of navByFund) {
      if (!map.size) continue;
      const rows = [...map.entries()]
        .map(([date, nav]) => ({ date, nav }))
        .sort((a, b) => (a.date < b.date ? -1 : 1));
      fs.writeFileSync(path.join(DATA_DIR, "nav", `${slug}.csv`), toCsv(["date", "nav"], rows));
    }
    for (const [slug, map] of divByFund) {
      const rows = [...map.entries()]
        .map(([recordDate, amount]) => ({ recordDate, amount }))
        .sort((a, b) => (a.recordDate < b.recordDate ? -1 : 1));
      fs.writeFileSync(
        path.join(DATA_DIR, "dividends", `${slug}.json`),
        `${JSON.stringify({ fundId: slug, dividends: rows }, null, 2)}\n`
      );
    }

    const reviewFile = fs.existsSync(path.join(DATA_DIR, "review-needed.json"))
      ? parseOrThrow(reviewFileSchema, JSON.parse(fs.readFileSync(path.join(DATA_DIR, "review-needed.json"), "utf8")), "data/review-needed.json")
      : { schemaVersion: 1 as const, updatedAt: todayISO(), items: [] as ReviewItem[] };
    const seen = new Set(reviewFile.items.map((i) => `${i.reason}|${i.file}|${i.row}`));
    const mergedReview = [...reviewFile.items];
    for (const item of review) {
      const key = `${item.reason}|${item.file}|${item.row}`;
      if (!seen.has(key)) {
        mergedReview.push(item);
        seen.add(key);
      }
    }
    fs.writeFileSync(
      path.join(DATA_DIR, "review-needed.json"),
      `${JSON.stringify({ schemaVersion: 1, updatedAt: todayISO(), items: mergedReview }, null, 2)}\n`
    );

    // Re-validate the written dataset through the real build path.
    clearDataCache();
    const ds = getDataset();
    fs.writeFileSync(
      path.join(DATA_DIR, "meta.json"),
      `${JSON.stringify({ ...ds.meta, lastUpdated: today }, null, 2)}\n`
    );

    appendRunLog([
      path.basename(input),
      "",
      `- Mode: ${stats.fundsNew ? "catalogue + NAV" : "NAV merge"}`,
      `- Funds: ${finalFunds.length} (new ${stats.fundsNew}, updated ${stats.fundsUpdated})`,
      `- NAV rows added: ${stats.navAdded}; unchanged: ${stats.navUnchanged}; sent to review: ${stats.navReview}`,
      `- Dividends added: ${stats.divAdded}`,
      `- Review items: ${review.length}`,
      "",
      "### Column mapping",
      "",
      "| Our field | Export column |",
      "| --- | --- |",
      mappingRows || "| (none detected) | |",
      "",
      "### Coverage after merge",
      "",
      "| Fund | NAV rows | Dividend rows |",
      "| --- | --- | --- |",
      perFund || "| (none) | 0 | 0 |",
      "",
    ]);

    console.log(`\n✔ Import complete. ${stats.navAdded} NAV rows added; ${review.length} row(s) waiting in data/review-needed.json.`);
    console.log("  Run `npm run data:check` next.\n");
  } catch (error) {
    restoreData(backup);
    throw error;
  } finally {
    fs.rmSync(path.join(ROOT, ".data-backup"), { recursive: true, force: true });
  }
}

// Only run the CLI when this file is executed directly; the pure helpers are
// imported by tests.
const invokedDirectly = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href === import.meta.url : false;
if (invokedDirectly) {
  main().catch((error) => {
    console.error(`\n✖ Import failed: ${error instanceof Error ? error.message : String(error)}\n`);
    process.exit(1);
  });
}
