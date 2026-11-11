import fs from "node:fs";
import path from "node:path";
import {
  approvedFileSchema,
  dividendsFileSchema,
  fundsFileSchema,
  parseOrThrow,
  reviewFileSchema,
  type ApprovedDeviation,
  type ReviewItem,
} from "../src/lib/schema";
import { getDataset, clearDataCache, DATA_DIR, ROOT } from "../src/lib/data";
import { parseCsvObjects, toCsv } from "../src/lib/csv";
import { daysBetween, isValidISODate, todayISO } from "../src/lib/date";
import type { NavRow } from "../src/lib/types";

/**
 * `npm run data:approve`
 *
 * Promotes rows from data/review-needed.json into the published files after a
 * human has checked them against the source. Rows without enough information
 * are left in review and reported.
 */

const dryRun = process.argv.includes("--dry-run");

function readJson(file: string): unknown {
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function main() {
  const reviewPath = path.join(DATA_DIR, "review-needed.json");
  if (!fs.existsSync(reviewPath)) {
    console.log("Nothing to approve: data/review-needed.json does not exist.");
    return;
  }
  const reviewFile = parseOrThrow(reviewFileSchema, readJson(reviewPath), "data/review-needed.json");
  if (!reviewFile.items.length) {
    console.log("Nothing to approve: the review queue is empty.");
    return;
  }

  const fundsFile = parseOrThrow(fundsFileSchema, readJson(path.join(DATA_DIR, "funds.json")), "data/funds.json");
  const byId = new Map(fundsFile.funds.map((f) => [f.id, f]));
  const approvedFile = fs.existsSync(path.join(DATA_DIR, "approved-deviations.json"))
    ? parseOrThrow(approvedFileSchema, readJson(path.join(DATA_DIR, "approved-deviations.json")), "data/approved-deviations.json")
    : { schemaVersion: 1 as const, approved: [] as ApprovedDeviation[] };

  const left: ReviewItem[] = [];
  let approvedNav = 0;
  let approvedDiv = 0;

  for (const item of reviewFile.items) {
    const raw = (item.raw ?? {}) as { fund?: string; date?: string; nav?: number | string; amount?: number | string };
    const fundKey = raw.fund ? String(raw.fund) : null;
    const date = raw.date ? String(raw.date) : null;
    const fund = fundKey ? fundsFile.funds.find((f) => f.slug === fundKey || f.id === fundKey) : null;

    if (!fund || !date || !isValidISODate(date)) {
      left.push(item);
      console.log(`  kept in review — not enough structured data: ${item.reason}`);
      continue;
    }

    const nav = raw.nav !== undefined ? Number(raw.nav) : null;
    const amount = raw.amount !== undefined ? Number(raw.amount) : null;

    if (nav !== null && isFinite(nav) && nav > 0) {
      const file = path.join(DATA_DIR, "nav", `${fund.slug}.csv`);
      const rows: NavRow[] = fs.existsSync(file)
        ? parseCsvObjects(fs.readFileSync(file, "utf8"))
            .map((r) => ({ date: String(r.date), nav: Number(r.nav) }))
            .filter((r) => isValidISODate(r.date) && isFinite(r.nav) && r.nav > 0)
        : [];
      const existing = rows.find((r) => r.date === date);
      if (existing && Math.abs(existing.nav - nav) > 1e-6) {
        left.push(item);
        console.log(`  kept in review — ${fund.slug} already has a different NAV for ${date} (${existing.nav}).`);
        continue;
      }
      if (!existing) {
        rows.push({ date, nav });
        rows.sort((a, b) => (a.date < b.date ? -1 : 1));
        if (!dryRun) fs.writeFileSync(file, toCsv(["date", "nav"], rows));
        approvedNav += 1;
      }
      const key = `${fund.id}|${date}`;
      if (!approvedFile.approved.some((a) => `${a.fundId}|${a.date}` === key)) {
        approvedFile.approved.push({
          fundId: fund.id,
          date,
          nav,
          reason: item.reason,
          approvedAt: todayISO(),
        });
      }
      console.log(`  approved NAV ${fund.slug} ${date} = ${nav}`);
      continue;
    }

    if (amount !== null && isFinite(amount) && amount > 0) {
      const navFile = path.join(DATA_DIR, "nav", `${fund.slug}.csv`);
      const navRows = fs.existsSync(navFile)
        ? parseCsvObjects(fs.readFileSync(navFile, "utf8")).map((r) => ({ date: String(r.date), nav: Number(r.nav) }))
        : [];
      const nearest = navRows.length ? Math.min(...navRows.map((r) => Math.abs(daysBetween(r.date, date)))) : Infinity;
      if (nearest > 10) {
        left.push(item);
        console.log(`  kept in review — dividend ${date} is still ${nearest} days from any NAV date.`);
        continue;
      }
      const file = path.join(DATA_DIR, "dividends", `${fund.slug}.json`);
      const divFile = fs.existsSync(file)
        ? parseOrThrow(dividendsFileSchema, readJson(file), file)
        : { fundId: fund.slug, dividends: [] as Array<{ recordDate: string; amount: number }> };
      if (!divFile.dividends.some((d) => d.recordDate === date)) {
        divFile.dividends.push({ recordDate: date, amount });
        divFile.dividends.sort((a, b) => (a.recordDate < b.recordDate ? -1 : 1));
        if (!dryRun) fs.writeFileSync(file, `${JSON.stringify({ fundId: fund.slug, dividends: divFile.dividends }, null, 2)}\n`);
        approvedDiv += 1;
      }
      console.log(`  approved dividend ${fund.slug} ${date} = ${amount}`);
      continue;
    }

    left.push(item);
    console.log(`  kept in review — no usable NAV or amount: ${item.reason}`);
  }

  if (dryRun) {
    console.log(`\nDry run: would approve ${approvedNav} NAV row(s) and ${approvedDiv} dividend(s); ${left.length} left.\n`);
    return;
  }

  fs.writeFileSync(
    path.join(DATA_DIR, "approved-deviations.json"),
    `${JSON.stringify({ schemaVersion: 1, approved: approvedFile.approved }, null, 2)}\n`
  );
  fs.writeFileSync(
    reviewPath,
    `${JSON.stringify({ schemaVersion: 1, updatedAt: todayISO(), items: left }, null, 2)}\n`
  );

  clearDataCache();
  const ds = getDataset();
  fs.writeFileSync(path.join(DATA_DIR, "meta.json"), `${JSON.stringify({ ...ds.meta, lastUpdated: todayISO() }, null, 2)}\n`);

  console.log(`\n✔ Approved ${approvedNav} NAV row(s) and ${approvedDiv} dividend(s). ${left.length} item(s) remain in review.`);
  console.log("  Run `npm run data:check` next.\n");
  void byId;
  void ROOT;
}

main();
