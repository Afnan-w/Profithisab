import fs from "node:fs";
import path from "node:path";
import { getDataset, ROOT } from "../src/lib/data";
import { daysBetween } from "../src/lib/date";
import { suspiciousJump } from "../src/lib/calc";

/**
 * `npm run data:check`
 *
 * Validates every committed data file (through the same Zod schemas the site
 * uses), enforces the licence rules, and rewrites data/meta.json from fact.
 */

const errors: string[] = [];
const warnings: string[] = [];

function main() {
  const ds = getDataset();
  const { funds, license, meta, benchmarks, verification, amcs } = ds;

  if (ds.isDemo) {
    warnings.push("No real funds in data/funds.json — the site is serving the DEMO dataset with a visible banner.");
  }

  // Licence gate: real data cannot be published without a filled permission record.
  if (!ds.isDemo) {
    if (!license.permissionDate.trim()) errors.push("data/license.json: permissionDate is empty. Fill it before publishing imported data.");
    if (!license.attributionText.trim()) errors.push("data/license.json: attributionText is empty. Fill in the exact wording the founder requires.");
    if (!license.permitted.length) errors.push("data/license.json: permitted[] is empty. Record what the permission covers.");
    if (!license.sourceName.trim()) errors.push("data/license.json: sourceName is empty.");
  }

  if (license.automatedFetching) {
    warnings.push(
      "license.json says automatedFetching = true. Fetching runs scripts/fetch-nav.ts against the sources listed in data/sources.json only — politely (clear UA, 2.5s delays, same-day cache, stops on 403/429). No other source (including ReturnKoto) may be fetched without written permission."
    );
  }

  if (verification.length && !license.displayVerification) {
    errors.push("data/verification.json has entries but license.json displayVerification is false. Remove the entries or get permission to show badges.");
  }

  const amcIds = new Set(amcs.map((a) => a.id));
  for (const f of funds) {
    if (!amcIds.has(f.amcId)) errors.push(`${f.slug}: amcId "${f.amcId}" is not in data/amcs.json.`);
    if (f.nav.length === 0) warnings.push(`${f.slug}: no NAV rows (shown as Missing).`);
    if (f.nav.length > 1) {
      const first = f.nav[0];
      const last = f.nav[f.nav.length - 1];
      const days = daysBetween(first.date, last.date);
      if (days > 60 && f.nav.length < 3) warnings.push(`${f.slug}: only ${f.nav.length} NAV rows across ${days} days.`);
    }
    for (let i = 1; i < f.nav.length; i++) {
      if (suspiciousJump(f.nav[i - 1], f.nav[i]) && ds.isDemo) {
        warnings.push(`${f.slug}: demo NAV jump over 15% at ${f.nav[i].date} (demo data is exempt).`);
        break;
      }
    }
    for (let i = 1; i < f.nav.length; i++) {
      const gap = daysBetween(f.nav[i - 1].date, f.nav[i].date);
      if (gap > 45) {
        warnings.push(`${f.slug}: ${gap}-day NAV gap between ${f.nav[i - 1].date} and ${f.nav[i].date} (the source did not publish these dates).`);
      }
    }
    for (const d of f.dividends) {
      if (!f.nav.length) warnings.push(`${f.slug}: dividend on ${d.recordDate} but no NAV history.`);
    }
  }

  for (const b of benchmarks) {
    if (b.status === "verified") {
      if (!b.source.url) errors.push(`benchmark ${b.id}: status verified requires an official source URL.`);
      if (!b.source.asOf) errors.push(`benchmark ${b.id}: status verified requires an asOf date.`);
      if (b.annualRate === null && !b.series) errors.push(`benchmark ${b.id}: verified but has neither a rate nor a series.`);
    }
    if (b.status === "unavailable" && b.annualRate !== null) {
      errors.push(`benchmark ${b.id}: marked unavailable but still carries an annualRate.`);
    }
    if (b.status === "approximate" && !b.note.toLowerCase().includes("approximate")) {
      warnings.push(`benchmark ${b.id}: approximate status should explain the simplification in note.`);
    }
  }

  if (!meta.latestNavDate) warnings.push("No fund has a usable NAV date yet.");

  if (errors.length) {
    console.error(`\n✖ data:check failed with ${errors.length} error(s):\n`);
    for (const e of errors) console.error(`  • ${e}`);
    if (warnings.length) {
      console.error("\nWarnings:");
      for (const w of warnings) console.error(`  • ${w}`);
    }
    process.exit(1);
  }

  const out = {
    ...meta,
    generatedAt: new Date().toISOString(),
  };
  fs.writeFileSync(path.join(ROOT, "data", "meta.json"), `${JSON.stringify(out, null, 2)}\n`);

  console.log("\n✔ data:check passed");
  console.log(`  Dataset:       ${ds.isDemo ? "DEMO (labelled)" : meta.sourceName}`);
  console.log(`  Funds:         ${meta.counts.funds} (complete ${meta.counts.complete}, partial ${meta.counts.partial}, missing ${meta.counts.missing})`);
  console.log(`  Stale (>30d):  ${meta.counts.stale}`);
  console.log(`  Latest NAV:    ${meta.latestNavDate ?? "n/a"}`);
  console.log(`  Verified:      ${meta.counts.verified}`);
  console.log(`  meta.json:     written`);
  if (warnings.length) {
    console.log(`\n  Warnings (${warnings.length}):`);
    for (const w of warnings.slice(0, 30)) console.log(`   • ${w}`);
    if (warnings.length > 30) console.log(`   • … and ${warnings.length - 30} more`);
  }
  console.log("");
}

main();
