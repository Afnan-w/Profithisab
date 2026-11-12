import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  PAYOUTS_PER_YEAR,
  fdrMaturity,
  lumpFuture,
  sipFuture,
  sonchayapatraCompounding,
  sonchayapatraPayout,
} from "../src/lib/hub/calc";
import {
  EXPECTED_INTERVAL,
  delayLabel,
  dhakaDate,
  dhakaDateTime,
  freshness,
  manualLabel,
  scheduleKind,
} from "../src/lib/hub/freshness";
import { validateBatch, validateRecord } from "../scripts/fetch/validate";
import { readLastGood, writeJson } from "../scripts/fetch/store";

/* ── SIP math ──────────────────────────────────────────────────────────────── */

test("sipFuture compounds monthly with start-of-month contributions", () => {
  // ৳1,000/mo at 12%/yr (=1%/mo) for exactly 1 year, no step-up.
  // Manual: Σ 1000 × 1.01^(12−i) for i = 0..11 = 1000 × ((1.01^12 − 1)/0.01) × 1.01
  const r = sipFuture(1000, 12, 1, 0);
  const expected = 1000 * ((Math.pow(1.01, 12) - 1) / 0.01) * 1.01;
  assert.ok(Math.abs(r.future - expected) < 1e-9, `future ${r.future} vs ${expected}`);
  assert.equal(r.invested, 12000);
  assert.ok(Math.abs(r.gain - (r.future - 12000)) < 1e-9);
  assert.equal(r.path.length, 1);
  assert.equal(r.path[0].year, 1);
});

test("sipFuture with zero rate only accumulates contributions", () => {
  const r = sipFuture(5000, 0, 2, 0);
  assert.equal(r.invested, 120000);
  assert.equal(r.future, 120000);
  assert.equal(r.gain, 0);
  assert.equal(r.path.length, 2);
});

test("sipFuture applies an annual step-up to the contribution", () => {
  // Year 1: 1000×12. Year 2 contribution steps up 10% → 1100×12.
  const r = sipFuture(1000, 0, 2, 10);
  assert.equal(r.invested, 12000 + 13200);
  assert.equal(r.future, 25200); // zero rate → contributions only
});

test("sipFuture rejects negative inputs", () => {
  assert.throws(() => sipFuture(-1, 10, 1));
  assert.throws(() => sipFuture(1000, 10, -1));
});

/* ── Lump sum math ─────────────────────────────────────────────────────────── */

test("lumpFuture compounds the principal monthly", () => {
  const r = lumpFuture(100000, 12, 1);
  const expected = 100000 * Math.pow(1.01, 12);
  assert.ok(Math.abs(r.future - expected) < 1e-9);
  assert.equal(r.invested, 100000);
  assert.ok(Math.abs(r.gain - (expected - 100000)) < 1e-9);
  assert.equal(r.path.length, 1);
});

test("lumpFuture with zero rate returns the principal", () => {
  const r = lumpFuture(50000, 0, 5);
  assert.equal(r.future, 50000);
  assert.equal(r.gain, 0);
  assert.equal(r.path.length, 5);
});

/* ── FDR math ──────────────────────────────────────────────────────────────── */

test("fdrMaturity computes compound interest and withholds tax on interest only", () => {
  // ৳100,000 at 10%/yr compounded monthly for 1 year, 10% TDS on interest.
  const r = fdrMaturity(100000, 10, 1, 12, 10);
  const maturity = 100000 * Math.pow(1 + 0.1 / 12, 12);
  const interest = maturity - 100000;
  assert.ok(Math.abs(r.grossInterest - interest) < 1e-9);
  assert.ok(Math.abs(r.tax - interest * 0.1) < 1e-9);
  assert.ok(Math.abs(r.netMaturity - (maturity - interest * 0.1)) < 1e-9);
  // Principal itself is never taxed.
  assert.ok(r.netMaturity > 100000);
});

test("fdrMaturity yearly compounding over 2 years", () => {
  const r = fdrMaturity(100000, 10, 2, 1, 0);
  assert.ok(Math.abs(r.grossInterest - 21000) < 1e-9); // 100000 × 1.1² − 100000
  assert.equal(r.tax, 0);
});

/* ── Sonchayapatra payout math ─────────────────────────────────────────────── */

test("payout frequencies map to payouts per year", () => {
  assert.equal(PAYOUTS_PER_YEAR.monthly, 12);
  assert.equal(PAYOUTS_PER_YEAR.quarterly, 4);
  assert.equal(PAYOUTS_PER_YEAR["half-yearly"], 2);
  assert.equal(PAYOUTS_PER_YEAR.annual, 1);
});

test("sonchayapatraPayout pays interest out and returns principal at maturity", () => {
  // ৳100,000 at 11.28%/yr quarterly for 5 years, 10% TDS.
  const r = sonchayapatraPayout(100000, 11.28, 5, "quarterly", 10);
  const perPayout = (100000 * 11.28) / 100 / 4; // 2820
  assert.ok(Math.abs(r.payoutPerPeriod - 2820) < 1e-9);
  assert.equal(r.payoutCount, 20); // 5 years × 4
  assert.ok(Math.abs(r.grossInterest - 2820 * 20) < 1e-9); // 56,400
  assert.ok(Math.abs(r.tax - 56400 * 0.1) < 1e-9); // 5,640
  assert.ok(Math.abs(r.netInterest - 56400 * 0.9) < 1e-9); // 50,760
  // Non-compounding: principal comes back untouched.
  assert.equal(r.maturityValue, 100000);
  assert.ok(Math.abs(r.totalValue - (100000 + 50760)) < 1e-9);
});

test("sonchayapatraPayout monthly pays exactly 1/12 of annual interest", () => {
  const r = sonchayapatraPayout(120000, 12, 1, "monthly", 0);
  assert.ok(Math.abs(r.payoutPerPeriod - 1200) < 1e-9);
  assert.equal(r.payoutCount, 12);
  assert.ok(Math.abs(r.grossInterest - 14400) < 1e-9);
});

test("sonchayapatraCompounding reinvests and taxes interest at maturity", () => {
  const r = sonchayapatraCompounding(100000, 11.28, 5, "quarterly", 10);
  const maturity = 100000 * Math.pow(1 + 0.1128 / 4, 20);
  assert.ok(Math.abs(r.maturityValue - (maturity - (maturity - 100000) * 0.1)) < 1e-6);
  assert.equal(r.totalValue, r.maturityValue);
  assert.ok(r.totalValue > 100000);
});

test("sonchayapatra rejects negative inputs", () => {
  assert.throws(() => sonchayapatraPayout(-1, 11, 5, "quarterly"));
  assert.throws(() => sonchayapatraCompounding(100000, 11, -1, "quarterly"));
});

/* ── Validation rules ──────────────────────────────────────────────────────── */

const baseRec = {
  value: 10,
  data_date: "2026-11-11",
  source_name: "Test source",
  source_url: "https://example.com",
};

test("validateRecord requires a source URL", () => {
  const v = validateRecord({ ...baseRec, source_url: "" }, "nav");
  assert.equal(v.ok, false);
  assert.equal(v.reason, "missing source_url");
});

test("validateRecord requires a valid data date", () => {
  assert.equal(validateRecord({ ...baseRec, data_date: "yesterday" }, "nav").ok, false);
  assert.equal(validateRecord({ ...baseRec, data_date: "2026-02-30" }, "nav").ok, false);
  assert.equal(validateRecord({ ...baseRec, data_date: "2026-11-11" }, "nav").ok, true);
});

test("validateRecord enforces NAV positivity", () => {
  assert.equal(validateRecord({ ...baseRec, value: -5 }, "nav").ok, false);
  assert.equal(validateRecord({ ...baseRec, value: 0 }, "nav").ok, false);
  assert.equal(validateRecord({ ...baseRec, value: 10.5 }, "nav").ok, true);
});

test("validateRecord clamps rates to 0–30", () => {
  assert.equal(validateRecord({ ...baseRec, value: -1 }, "rates").ok, false);
  assert.equal(validateRecord({ ...baseRec, value: 31 }, "rates").ok, false);
  assert.equal(validateRecord({ ...baseRec, value: 30 }, "rates").ok, true);
  assert.equal(validateRecord({ ...baseRec, value: 0 }, "fdr").ok, true);
});

test("validateRecord requires a positive index level", () => {
  assert.equal(validateRecord({ ...baseRec, value: 0 }, "index").ok, false);
  assert.equal(validateRecord({ ...baseRec, value: 5445.06 }, "index").ok, true);
});

test("validateBatch fails the run when >20% of records are invalid", () => {
  const good = { ...baseRec, value: 10 };
  const bad = { ...baseRec, value: -1 };
  // 8 good + 2 bad = 80% pass → ok (borderline, kept)
  const borderline = validateBatch([good, good, good, good, good, good, good, good, bad, bad], "nav");
  assert.equal(borderline.ok, true);
  assert.equal(borderline.invalid, 2);
  // 7 good + 3 bad = 70% pass → not ok, last good data must be kept
  const failing = validateBatch([good, good, good, good, good, good, good, bad, bad, bad], "nav");
  assert.equal(failing.ok, false);
  // An empty batch never passes (nothing valid to write).
  assert.equal(validateBatch([], "nav").ok, false);
});

/* ── Last-good fallback ────────────────────────────────────────────────────── */

test("readLastGood returns the previous payload so a failed run can keep it", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "hub-lastgood-"));
  const file = path.join(dir, "result.json");
  try {
    // No file yet → null (nothing to fall back to, so nothing is written).
    assert.equal(readLastGood(file), null);
    // A validated write lands on disk…
    writeJson(file, { schemaVersion: 1, records: [{ value: 1, data_date: "2026-11-11" }] });
    const first = readLastGood(file) as { records: Array<{ value: number }> };
    assert.equal(first.records[0].value, 1);
    // …and after a corrupt/failed overwrite attempt the last good copy still reads.
    fs.writeFileSync(file, "{not json");
    assert.equal(readLastGood(file), null);
    writeJson(file, { schemaVersion: 1, records: [{ value: 2, data_date: "2026-11-12" }] });
    const second = readLastGood(file) as { records: Array<{ value: number }> };
    assert.equal(second.records[0].value, 2);
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

/* ── Stale-data warning ────────────────────────────────────────────────────── */

const HOUR = 60 * 60 * 1000;

test("scheduleKind maps registry schedule strings to freshness classes", () => {
  assert.equal(scheduleKind("daily after market close"), "daily");
  assert.equal(scheduleKind("every 15 minutes during DSE trading hours"), "fifteen-minutes");
  assert.equal(scheduleKind("manual update"), "manual");
  assert.equal(scheduleKind(null), "unknown");
  assert.equal(scheduleKind("n/a"), "unknown");
});

test("freshness flags a daily source as outdated past its interval", () => {
  const now = Date.parse("2026-11-12T12:00:00.000Z");
  const freshRun = freshness({ fetchedAt: "2026-11-12T06:00:00.000Z", schedule: "daily after market close", now });
  assert.equal(freshRun.outdated, false);
  const oldRun = freshness({ fetchedAt: "2026-11-10T06:00:00.000Z", schedule: "daily after market close", now });
  assert.equal(oldRun.outdated, true);
  assert.ok(oldRun.ageMs! > EXPECTED_INTERVAL.daily);
});

test("freshness flags a 15-minute source after 45 minutes", () => {
  const now = Date.parse("2026-11-12T12:00:00.000Z");
  const ok = freshness({ fetchedAt: "2026-11-12T11:30:00.000Z", schedule: "every 15 minutes during trading", now });
  assert.equal(ok.outdated, false);
  const stale = freshness({ fetchedAt: "2026-11-12T11:00:00.000Z", schedule: "every 15 minutes during trading", now });
  assert.equal(stale.outdated, true);
});

test("manual and unknown schedules are never flagged stale", () => {
  const now = Date.parse("2026-11-12T12:00:00.000Z");
  assert.equal(freshness({ fetchedAt: "2020-01-01T00:00:00.000Z", schedule: "manual update", now }).outdated, false);
  assert.equal(freshness({ fetchedAt: "2020-01-01T00:00:00.000Z", schedule: null, now }).outdated, false);
});

test("freshness with no fetch time is not stale (nothing was ever fetched)", () => {
  assert.equal(freshness({ fetchedAt: null, schedule: "daily" }).outdated, false);
  assert.equal(freshness({ fetchedAt: "not-a-date", schedule: "daily" }).outdated, false);
});

/* ── Presentation helpers (Asia/Dhaka, delay, manual) ──────────────────────── */

test("dhakaDate and dhakaDateTime render in Asia/Dhaka", () => {
  // 2026-11-11T20:00:00Z = 12 Nov 2026, 2:00 AM in Dhaka (UTC+6).
  assert.equal(dhakaDate("2026-11-11T20:00:00.000Z"), "12 Nov 2026");
  const dt = dhakaDateTime("2026-11-11T20:00:00.000Z");
  assert.ok(dt?.startsWith("12 Nov 2026"));
  assert.ok(dt?.includes("2:00"));
  assert.equal(dhakaDate(null), null);
  assert.equal(dhakaDate("junk"), null);
});

test("delayLabel only appears for genuinely delayed sources", () => {
  assert.equal(delayLabel(15), "Delayed by up to 15 minutes");
  assert.equal(delayLabel(null), null);
  assert.equal(delayLabel(0), null);
  assert.equal(delayLabel(-5), null);
});

test("manualLabel reads “manually updated on [date]”", () => {
  assert.equal(manualLabel("2026-11-11"), "manually updated on 11 Nov 2026");
  assert.equal(manualLabel(null), null);
});
