import { test } from "node:test";
import assert from "node:assert/strict";
import {
  buildMapping,
  parseBool,
  parseDateValue,
  parseFundType,
  parseNumber,
  slugify,
} from "../scripts/import";
import { parseCsv, parseCsvObjects, toCsv } from "../src/lib/csv";

test("column mapping recognises common export headings", () => {
  const map = buildMapping(["Fund Name", "NAV Date", "NAV", "Dividend", "AMC", "Fund Type", "Shariah"]);
  assert.equal(map.name, "Fund Name");
  assert.equal(map.fund, "Fund Name");
  assert.equal(map.date, "NAV Date");
  assert.equal(map.nav, "NAV");
  assert.equal(map.dividend, "Dividend");
  assert.equal(map.amc, "AMC");
  assert.equal(map.type, "Fund Type");
  assert.equal(map.shariah, "Shariah");
  assert.equal(map.slug, null);
});

test("column mapping respects a manual override", () => {
  const map = buildMapping(["Scheme", "Unit Price", "As On"], { nav: "Unit Price", date: "As On" });
  assert.equal(map.nav, "Unit Price");
  assert.equal(map.date, "As On");
  // An override that is not actually a column is ignored; auto-detection still runs.
  const bad = buildMapping(["Scheme", "Unit Price"], { nav: "Missing Column" });
  assert.equal(bad.nav, "Unit Price");
  assert.equal(buildMapping(["Scheme"], { nav: "Missing Column" }).nav, null);
});

test("ISO dates pass through and real calendar validation applies", () => {
  assert.equal(parseDateValue("2026-10-31"), "2026-10-31");
  assert.equal(parseDateValue("2026-02-30"), null);
  assert.equal(parseDateValue("2026-13-01"), null);
});

test("slash dates are read day-first (as documented for the importer)", () => {
  assert.equal(parseDateValue("31/10/2026"), "2026-10-31");
  assert.equal(parseDateValue("05/01/2026"), "2026-01-05");
  // Month-first US input is rejected rather than silently swapped.
  assert.equal(parseDateValue("10/31/2026"), null);
  assert.equal(parseDateValue("2024/01/31"), "2024-01-31");
});

test("named-month dates and two-digit years parse", () => {
  assert.equal(parseDateValue("31-Oct-2026"), "2026-10-31");
  assert.equal(parseDateValue("31 Oct 2026"), "2026-10-31");
  assert.equal(parseDateValue("31-Oct-26"), "2026-10-31");
  assert.equal(parseDateValue("31-Foo-2026"), null);
});

test("Excel serial dates convert to ISO", () => {
  // 45292 is 2024-01-01 in Excel's 1900 date system.
  assert.equal(parseDateValue(45292), "2024-01-01");
  assert.equal(parseDateValue(1), null);
});

test("empty and nonsense dates return null", () => {
  for (const value of [null, undefined, "", "not a date", "   "]) {
    assert.equal(parseDateValue(value), null);
  }
});

test("numbers handle taka signs, thousands separators and percent marks", () => {
  assert.equal(parseNumber("৳1,234.50"), 1234.5);
  assert.equal(parseNumber("1,00,000"), 100000);
  assert.equal(parseNumber("12%"), 12);
  assert.equal(parseNumber("  9.75 "), 9.75);
  assert.equal(parseNumber(3.5), 3.5);
  assert.equal(parseNumber(""), null);
  assert.equal(parseNumber("abc"), null);
  assert.equal(parseNumber(Number.NaN), null);
});

test("booleans accept the labels founders actually use", () => {
  assert.equal(parseBool("Yes"), true);
  assert.equal(parseBool("true"), true);
  assert.equal(parseBool("1"), true);
  assert.equal(parseBool("Shariah"), true);
  assert.equal(parseBool("No"), false);
  assert.equal(parseBool("0"), false);
  assert.equal(parseBool("conventional"), false);
  assert.equal(parseBool("maybe"), null);
  assert.equal(parseBool(null), null);
});

test("fund types map to growth, balanced or income", () => {
  assert.equal(parseFundType("Equity Fund"), "growth");
  assert.equal(parseFundType("hybrid"), "balanced");
  assert.equal(parseFundType("Fixed Income"), "income");
  assert.equal(parseFundType("money market"), "income");
  assert.equal(parseFundType("unknown"), null);
  assert.equal(parseFundType(null), null);
});

test("slugs are URL-safe and stable", () => {
  assert.equal(slugify("ABC & Co. Fund!"), "abc-and-co-fund");
  assert.equal(slugify("  Edge High-Quality Income  "), "edge-high-quality-income");
  assert.equal(slugify("---"), "");
  assert.ok(slugify("x".repeat(200)).length <= 80);
});

test("CSV reader handles BOM, quoted commas and embedded newlines", () => {
  const text = '\uFEFFfund,nav,note\n"ABC, Ltd",12.5,"line one\nline two"\nXYZ,13,\n';
  assert.deepEqual(parseCsv(text), [
    ["fund", "nav", "note"],
    ["ABC, Ltd", "12.5", "line one\nline two"],
    ["XYZ", "13", ""],
  ]);
  assert.deepEqual(parseCsvObjects(text)[0], {
    fund: "ABC, Ltd",
    nav: "12.5",
    note: "line one\nline two",
  });
});

test("CSV writer escapes fields that need quoting", () => {
  const out = toCsv(["date", "nav", "note"], [{ date: "2026-10-31", nav: 12.5, note: 'a "quoted", value' }]);
  assert.equal(out, 'date,nav,note\n2026-10-31,12.5,"a ""quoted"", value"\n');
});
