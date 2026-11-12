import { test } from "node:test";
import assert from "node:assert/strict";
import {
  alignBenchTrail,
  annualisedVolatility,
  betaVsIndex,
  cagrFrom,
  dividendEvents,
  latestNav,
  lumpSum,
  maxDrawdown,
  monthEndSeries,
  monthsAvailable,
  navOnOrAfter,
  navOnOrBefore,
  sipRun,
  suspiciousJump,
  xirr,
} from "../src/lib/calc";
import type { NavRow } from "../src/lib/types";

/**
 * Hand-checked arithmetic. Expected values are written out longhand in the
 * comments so a non-coder can follow each assertion.
 */

const nav = (date: string, value: number): NavRow => ({ date, nav: value });

function monthlySeries(fromYear: number, fromMonth: number, count: number, price: (i: number) => number): NavRow[] {
  const rows: NavRow[] = [];
  for (let i = 0; i < count; i++) {
    const monthIndex = fromMonth - 1 + i;
    const year = fromYear + Math.floor(monthIndex / 12);
    const month = (monthIndex % 12) + 1;
    rows.push(nav(`${year}-${String(month).padStart(2, "0")}-01`, price(i)));
  }
  return rows;
}

test("lump sum doubles over two years", () => {
  // ৳1,000 grows to ৳2,000. CAGR = 2^(365/731) - 1 = 41.4%/yr.
  const series = {
    nav: [nav("2024-01-01", 100), nav("2026-01-01", 200)],
    dividends: [],
  };
  const run = lumpSum(series, 1000, 2, "reinvest");
  assert.ok(run);
  assert.equal(run.result.growth, 2);
  assert.equal(run.result.startDate, "2024-01-01");
  assert.equal(run.result.endDate, "2026-01-01");
  assert.ok(Math.abs(run.result.cagr - (Math.pow(2, 365 / 731) - 1)) < 1e-9);
  assert.equal(run.path[run.path.length - 1].value, 2000);
});

test("lump sum with no years starts at the first published NAV", () => {
  const series = { nav: [nav("2024-01-01", 50), nav("2025-01-01", 75)], dividends: [] };
  const run = lumpSum(series, 1000, null);
  assert.ok(run);
  assert.equal(run.result.startDate, "2024-01-01");
  assert.equal(run.result.growth, 1.5);
});

test("short history returns null instead of an invented annual figure", () => {
  // 31 days is below the 90-day minimum.
  const series = { nav: [nav("2026-01-01", 10), nav("2026-02-01", 12)], dividends: [] };
  assert.equal(lumpSum(series, 1000, null), null);
  // A requested 3-year window that the fund does not cover also returns null.
  const long = { nav: [nav("2025-01-01", 10), nav("2026-01-01", 12)], dividends: [] };
  assert.equal(lumpSum(long, 1000, 3), null);
});

test("dividends reinvested versus taken as cash", () => {
  // 10 units at ৳100. A ৳10/unit dividend buys 1 more unit at ৳100.
  // Reinvested: 11 units x ৳120 = ৳1,320.
  // Cash: 10 units x ৳120 + ৳100 cash = ৳1,300.
  const series = {
    nav: [nav("2024-01-01", 100), nav("2024-06-01", 100), nav("2025-01-01", 120)],
    dividends: [{ recordDate: "2024-06-01", amount: 10 }],
  };
  const reinvested = lumpSum(series, 1000, null, "reinvest");
  const cash = lumpSum(series, 1000, null, "cash");
  assert.ok(reinvested);
  assert.ok(cash);
  assert.equal(Math.round(reinvested.result.growth * 1000), 1320);
  assert.equal(Math.round(cash.result.growth * 1000), 1300);
  assert.ok(reinvested.result.cagr > cash.result.cagr);
});

test("SIP on a flat NAV returns exactly 0% XIRR", () => {
  // 12 monthly purchases of ৳1,000 at ৳100 = 120 units worth ৳12,000.
  const series = { nav: monthlySeries(2024, 1, 13, () => 100), dividends: [] };
  const run = sipRun(series, 1000, 1, "reinvest");
  assert.ok(run);
  assert.equal(run.result.invested, 12000);
  assert.equal(run.result.months, 12);
  assert.equal(Math.round(run.result.final), 12000);
  assert.ok(Math.abs(run.result.xirr) < 1e-6);
});

test("SIP on a rising NAV has a positive XIRR", () => {
  const series = { nav: monthlySeries(2024, 1, 13, (i) => 100 + i * 5), dividends: [] };
  const run = sipRun(series, 1000, 1, "reinvest");
  assert.ok(run);
  assert.ok(run.result.final > run.result.invested);
  assert.ok(run.result.xirr > 0);
});

test("SIP refuses less than twelve months of history", () => {
  const series = { nav: monthlySeries(2025, 1, 6, () => 100), dividends: [] };
  assert.equal(sipRun(series, 1000, null), null);
});

test("XIRR matches a hand-calculated one-year 10% gain", () => {
  // 366 days (2024 is a leap year), so 1.1^(365/366) - 1 = 9.96%.
  const rate = xirr([
    { date: "2024-01-01", amount: -1000 },
    { date: "2025-01-01", amount: 1100 },
  ]);
  assert.ok(rate !== null);
  assert.ok(Math.abs(rate - (Math.pow(1.1, 365 / 366) - 1)) < 1e-6);
});

test("XIRR returns null without both an inflow and an outflow", () => {
  assert.equal(xirr([{ date: "2024-01-01", amount: 100 }]), null);
  assert.equal(
    xirr([
      { date: "2024-01-01", amount: 100 },
      { date: "2025-01-01", amount: 200 },
    ]),
    null
  );
});

test("maximum drawdown finds the worst peak-to-trough fall", () => {
  // 120 -> 90 is a 25% fall.
  const dd = maxDrawdown([nav("2024-01-01", 100), nav("2024-03-01", 120), nav("2024-06-01", 90), nav("2024-09-01", 110)]);
  assert.equal(dd.value, -0.25);
  assert.equal(dd.peakDate, "2024-03-01");
  assert.equal(dd.troughDate, "2024-06-01");
});

test("NAV lookups respect exact and missing dates", () => {
  const rows = [nav("2024-01-01", 10), nav("2024-01-10", 11), nav("2024-01-20", 12)];
  assert.equal(navOnOrAfter(rows, "2024-01-05")?.date, "2024-01-10");
  assert.equal(navOnOrBefore(rows, "2024-01-05")?.date, "2024-01-01");
  assert.equal(navOnOrAfter(rows, "2024-01-10")?.nav, 11);
  assert.equal(navOnOrBefore(rows, "2023-12-31"), null);
  assert.equal(navOnOrAfter(rows, "2024-01-21"), null);
  assert.equal(latestNav(rows)?.date, "2024-01-20");
});

test("month-end series keeps only the last observation per month", () => {
  const rows = [nav("2024-01-05", 10), nav("2024-01-31", 11), nav("2024-02-10", 12), nav("2024-02-29", 13)];
  assert.deepEqual(
    monthEndSeries(rows).map((r) => [r.date, r.nav]),
    [
      ["2024-01-31", 11],
      ["2024-02-29", 13],
    ]
  );
});

test("monthsAvailable rounds whole months down", () => {
  assert.equal(monthsAvailable([nav("2024-01-01", 10), nav("2025-01-01", 11)]), 12);
  assert.equal(monthsAvailable([nav("2024-01-01", 10)]), 0);
});

test("CAGR guard rejects impossible inputs", () => {
  assert.equal(cagrFrom(0, 365), null);
  assert.equal(cagrFrom(-1, 365), null);
  assert.equal(cagrFrom(1.1, 0), null);
  assert.ok(Math.abs((cagrFrom(1.1, 365) as number) - 0.1) < 1e-9);
});

test("annualised volatility is null for a too-short history", () => {
  assert.equal(annualisedVolatility(monthlySeries(2025, 1, 6, () => 100)), null);
});

test("suspicious NAV jumps over 15% are flagged", () => {
  assert.equal(suspiciousJump(nav("2024-01-01", 100), nav("2024-01-02", 115)), false);
  assert.equal(suspiciousJump(nav("2024-01-01", 100), nav("2024-01-02", 116)), true);
  assert.equal(suspiciousJump(nav("2024-01-01", 100), nav("2024-01-02", 84)), true);
  assert.equal(suspiciousJump(nav("2024-01-01", 0), nav("2024-01-02", 100)), false);
});

// Keep the helper export exercised so the test file documents the dividend
// rule even though lumpSum covers it end to end.
test("dividend events are sorted and bounded by the window", () => {
  const series = {
    nav: [nav("2024-01-01", 100), nav("2024-06-01", 100), nav("2025-01-01", 120)],
    dividends: [
      { recordDate: "2024-06-01", amount: 10 },
      { recordDate: "2023-12-01", amount: 5 },
      { recordDate: "2025-02-01", amount: 7 },
    ],
  };
  const events = dividendEvents(series, "2024-01-01", "2025-01-01");
  assert.equal(events.length, 1);
  assert.equal(events[0].amount, 10);
});

/* ── Benchmark alignment + beta ───────────────────────────────────────────── */

test("alignBenchTrail rescales the index to the fund's first covered month", () => {
  // Fund runs Jan–Apr; the index starts in February.
  const months = ["2026-01", "2026-02", "2026-03", "2026-04"];
  const levels = [
    { date: "2026-02-27", value: 2000 },
    { date: "2026-03-31", value: 2100 },
    { date: "2026-04-29", value: 2200 },
  ];
  const trail = alignBenchTrail(months, levels);
  assert.deepEqual(trail, [null, 1, 1.05, 1.1]);
});

test("alignBenchTrail returns all nulls for too-short series", () => {
  assert.deepEqual(alignBenchTrail(["2026-01", "2026-02"], [{ date: "2026-01-31", value: 100 }]), [null, null]);
});

test("betaVsIndex recovers a 1.0 beta for a fund that moves with the index", () => {
  // The fund's NAV = index level / 100 every month, so its monthly returns match the index.
  const levels: Array<{ date: string; value: number }> = [];
  const navRows: NavRow[] = [];
  for (let i = 0; i < 24; i++) {
    const d = new Date(Date.UTC(2024, i, 28)).toISOString().slice(0, 10);
    const level = 1000 + i * 10 + (i % 3) * 5; // some wiggles
    levels.push({ date: d, value: level });
    navRows.push(nav(d, level / 100));
  }
  const beta = betaVsIndex(navRows, levels);
  assert.ok(beta !== null && Math.abs(beta - 1) < 0.001, `got ${beta}`);
});

test("betaVsIndex needs 12 clean overlapping months", () => {
  const levels = Array.from({ length: 10 }, (_, i) => ({
    date: new Date(Date.UTC(2025, i, 28)).toISOString().slice(0, 10),
    value: 1000 + i,
  }));
  const navRows = levels.map((l) => nav(l.date, 10));
  assert.equal(betaVsIndex(navRows, levels), null);
  assert.equal(betaVsIndex(navRows, null), null);
});
