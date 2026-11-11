import { getDataset } from "../src/lib/data";
import { daysBetween, todayISO } from "../src/lib/date";

/**
 * `npm run data:staleness [--json] [--max-age=21]`
 *
 * Reports how old the dataset is and which funds are stale (no NAV in 30+
 * days). The weekly workflow uses --max-age=21 to open an issue when three
 * weeks pass without a new NAV.
 */

const args = process.argv.slice(2);
const json = args.includes("--json");
const maxArg = args.find((a) => a.startsWith("--max-age="));
const maxAge = maxArg ? Number(maxArg.split("=")[1]) : null;

const ds = getDataset();
const today = todayISO();
const latest = ds.meta.latestNavDate;
const age = latest ? daysBetween(latest, today) : null;
const stale = ds.funds.filter((f) => f.isStale);
const missing = ds.funds.filter((f) => f.nav.length === 0);

const report = {
  isDemo: ds.isDemo,
  latestNavDate: latest,
  ageDays: age,
  funds: ds.funds.length,
  stale: stale.map((f) => ({ slug: f.slug, name: f.name, latestNavDate: f.latestNavDate })),
  missing: missing.map((f) => ({ slug: f.slug, name: f.name })),
  reviewItems: ds.review.length,
  maxAge,
};

if (json) {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log("\nData freshness");
  console.log("──────────────");
  console.log(`Dataset:        ${ds.isDemo ? "DEMO (not published fund data)" : ds.meta.sourceName}`);
  console.log(`Funds:          ${report.funds} (${report.missing.length} with no NAV)`);
  console.log(`Latest NAV:     ${latest ?? "none"}${age === null ? "" : ` (${age} day${age === 1 ? "" : "s"} old)`}`);
  console.log(`Stale funds:    ${stale.length}${stale.length ? ` — ${stale.map((f) => f.slug).join(", ")}` : ""}`);
  console.log(`Review queue:   ${report.reviewItems}`);
  if (ds.isDemo) console.log("\nWarning: the site is serving demo data. Fill license.json and import a real export.");
}

if (maxAge !== null && Number.isFinite(maxAge) && age !== null && age > maxAge) {
  console.error(`\n✖ Latest NAV is ${age} days old (limit ${maxAge}). Open a data-refresh issue.`);
  process.exit(1);
}
