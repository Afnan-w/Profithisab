import assert from "node:assert/strict";
import { test } from "node:test";
import {
  cagrOfLevels,
  monthEndLevels,
  parseCwtTable,
  parseEdgePage,
  parseIdlcTable,
  parseLankabdTable,
  parseLbNavHistory,
  parseNavDate,
  parseShantaPage,
} from "../scripts/fetch-nav";

/* ── parseNavDate ─────────────────────────────────────────────────────────── */

test("parseNavDate handles full month names (IDLC style)", () => {
  assert.equal(parseNavDate("November 10, 2026"), "2026-11-10");
  assert.equal(parseNavDate("February 1, 2024"), "2024-02-01");
});

test("parseNavDate handles d-MMM-yy (Shanta style)", () => {
  assert.equal(parseNavDate("8-Mar-18"), "2018-03-08");
  assert.equal(parseNavDate("10-Nov-26"), "2026-11-10");
});

test("parseNavDate returns null for junk", () => {
  assert.equal(parseNavDate("not a date"), null);
  assert.equal(parseNavDate(""), null);
});

/* ── IDLC table ───────────────────────────────────────────────────────────── */

const idlcHtml = `
<table class='table table-bordered'>
<thead><tr><td>Fund Name</td><td>NAV Date</td><td>NAV at Cost Value</td><td>NAV at Fair Value</td><td>Buy</td><td>Sale</td></tr></thead>
<tbody><tr>
<td>IDLC Growth Fund</td><td>November 10, 2026</td><td>12.48</td><td>12.88</td><td>12.88</td><td>12.88</td>
</tr><tr>
<td>IDLC Growth Fund</td><td>November 9, 2026</td><td>12.51</td><td>12.84</td><td>12.84</td><td>12.84</td>
</tr></tbody></table>`;

test("parseIdlcTable reads NAV at Fair Value (not cost)", () => {
  const rows = parseIdlcTable(idlcHtml);
  assert.equal(rows.length, 2);
  assert.deepEqual(rows[0], { fund: "IDLC Growth Fund", date: "2026-11-10", nav: 12.88 });
  assert.deepEqual(rows[1], { fund: "IDLC Growth Fund", date: "2026-11-09", nav: 12.84 });
});

/* ── Shanta __NEXT_DATA__ payload ─────────────────────────────────────────── */

const shantaHtml = `<html><body><script id="__NEXT_DATA__" type="application/json" crossorigin="anonymous">
{"props":{"pageProps":{"data":{"data":{"list":[
 {"page_data":{"slug":"shanta-amanah-shariah-fund","title":"Shanta Amanah Shariah Fund"},
  "performance":{"data":[{"Date":"4-Feb-19","Nav":10,"Dividend":0},{"Date":"10-Nov-26","Nav":10.581,"Dividend":0}]}},
 {"page_data":{"slug":"shanta-fixed-income-fund","title":"Shanta Fixed Income Fund"},
  "performance":{"data":[{"Date":"19-Aug-21","Nav":10}]}},
 {"page_data":{"slug":"some-unmapped-fund"},"performance":{"data":[]}}
]}},
"dividendData":{"success":true,"data":[{"id":16,"date":"2020-01-02","fund_type":"sasf","value":"0.1300000"}]},
"dseData":[{"date":"2026-11-11","dsex":"5445.05"}]}}}</script></body></html>`;

test("parseShantaPage extracts NAV rows and dividends", () => {
  const payload = parseShantaPage(shantaHtml);
  assert.deepEqual(payload.fundSlugs.sort(), [
    "shanta-amanah-shariah-fund",
    "shanta-fixed-income-fund",
    "some-unmapped-fund",
  ]);
  assert.equal(payload.navs.length, 3);
  assert.ok(payload.navs.some((n) => n.fund === "shanta-fixed-income-fund" && n.date === "2021-08-19" && n.nav === 10));
  assert.deepEqual(payload.dividends, [{ fund: "sasf", recordDate: "2020-01-02", amount: 0.13 }]);
  assert.deepEqual(payload.dse, [{ date: "2026-11-11", dsex: 5445.05, ds30: null, dses: null }]);
});

test("parseShantaPage throws on layout change", () => {
  assert.throws(() => parseShantaPage("<html><body>no payload</body></html>"));
});

/* ── DSE index series → benchmarks ────────────────────────────────────────── */

test("monthEndLevels keeps the last published level of each month", () => {
  const levels = monthEndLevels(
    [
      { date: "2026-01-05", dsex: 5000, ds30: null, dses: null },
      { date: "2026-01-28", dsex: 5100, ds30: null, dses: null },
      { date: "2026-02-02", dsex: 5050, ds30: null, dses: null },
      { date: "2026-02-15", dsex: null, ds30: null, dses: null },
    ],
    (p) => p.dsex
  );
  assert.deepEqual(levels, [
    { date: "2026-01-28", value: 5100 },
    { date: "2026-02-02", value: 5050 },
  ]);
});

test("cagrOfLevels needs at least a year and returns percent", () => {
  const year: Array<{ date: string; value: number }> = [];
  for (let i = 0; i < 13; i++) {
    const d = new Date(Date.UTC(2025, i, 28));
    year.push({ date: d.toISOString().slice(0, 10), value: 100 * Math.pow(1.1, i / 12) });
  }
  const rate = cagrOfLevels(year);
  assert.ok(rate !== null && Math.abs(rate - 10) < 1.5, `got ${rate}`);
  assert.equal(cagrOfLevels(year.slice(0, 6)), null);
});

/* ── EDGE AMC fund page (Google Charts NAV history + summary tiles) ───────── */

const edgeHtml = `
<div class="plan_funt_item"><div class="plan_funt_item_tt text-center"><h4>Inception Date</h4></div>
<div class="plan_funt_item_vl text-center"><h5>02 Aug 2018</h5></div></div>
<div class="plan_funt_item"><div class="plan_funt_item_tt text-center"><h4>Fund Size*</h4></div>
<div class="plan_funt_item_vl text-center"><h5>BDT 237,360,847</h5></div></div>
<div class="nav_chart_item"><div id="curve_chart"></div></div>
<script>
google.charts.load('current', { 'packages': ['corechart'] });
function drawChart() {
  var data = google.visualization.arrayToDataTable([
    ['Date', 'EDGEBDMF', 'DSEX', 'DS30'],
    [new Date(2026, 10, 12), 21.26, 10.08, 10.88],
    [new Date(2026, 9, 31), 20.92, 10.03, 11.02],
    [new Date(2026, 0, 5), 10.05, 5.01, 5.5],
    [new Date(2018, 7, 9), 10.01, 10.01, 10.00],
  ]);
  chart.draw(data, options);
}
var pie = google.visualization.arrayToDataTable([
  ['Sector', 'Portfolio Weight'], ['Pharmaceuticals', 22.85], ['Consumer', 16.90],
]);
</script>`;

test("parseEdgePage reads the full NAV series, fund size and inception from a fund page", () => {
  const payload = parseEdgePage(edgeHtml);
  assert.equal(payload.navs.length, 4);
  assert.deepEqual(payload.navs[0], { fund: "", date: "2026-11-12", nav: 21.26 });
  assert.deepEqual(payload.navs[2], { fund: "", date: "2026-01-05", nav: 10.05 }); // month is 0-based in the series
  assert.deepEqual(payload.navs[3], { fund: "", date: "2018-08-09", nav: 10.01 });
  assert.equal(payload.fundSize, 23.74); // BDT 237,360,847 → crore
  assert.equal(payload.inception, "2018-08-02");
});

test("parseEdgePage handles a single-series chart (DSES Shariah funds) and missing tiles", () => {
  const single = `
    <script>
    var data = google.visualization.arrayToDataTable([
      ['Date', 'EDGEHQIF'],
      [new Date(2026, 10, 12), 15.81],
      [new Date(2026, 10, 11), 15.80],
    ]);
    </script>`;
  const payload = parseEdgePage(single);
  assert.equal(payload.navs.length, 2);
  assert.equal(payload.navs[0].nav, 15.81);
  assert.equal(payload.fundSize, null);
  assert.equal(payload.inception, null);
});

/* ── CWT AMC fund page (daily NAV table) ─────────────────────────────────── */

const cwtHtml = `
<p>Publishing Date Validity Date NAV (At Market Price) NAV (At Cost Price) Sale Price Repurchase Price DSEX</p>
<table>
<tr><td>12/11/2026</td><td>15/11/2026</td><td>15.90</td><td>13.94</td><td>15.90</td><td>15.90</td><td>5444.91</td></tr>
<tr><td>11/11/2026</td><td>12/11/2026</td><td>15.82</td><td>13.93</td><td>15.82</td><td>15.82</td><td>5445.06</td></tr>
<tr><td>n/a</td><td>n/a</td><td>n/a</td></tr>
</table>`;

test("parseCwtTable reads the at-market NAV from dd/mm/yyyy table rows", () => {
  const rows = parseCwtTable(cwtHtml);
  assert.equal(rows.length, 2);
  assert.deepEqual(rows[0], { fund: "", date: "2026-11-12", nav: 15.9 });
  assert.deepEqual(rows[1], { fund: "", date: "2026-11-11", nav: 15.82 });
});

/* ── LankaBangla AML NAV-history API ──────────────────────────────────────── */

const lbNavJson = JSON.stringify({
  data: [
    ["LankaBangla 1st Balanced Unit Fund", "2016-11-03", "2016-11-03", "10.11", "10.11", "10.11", "4673.00"],
    ["LankaBangla 1st Balanced Unit Fund", "2016-11-03", "2016-11-10", "10.13", "10.13", "10.13", "4677.00"],
    ["LankaBangla 1st Balanced Unit Fund", "2016-11-03", "2026-11-12", "11.65", "11.65", "11.65", "5444.90650"],
  ],
});

test("parseLbNavHistory reads the weekly NAV series from the AMC endpoint", () => {
  const rows = parseLbNavHistory(lbNavJson);
  assert.equal(rows.length, 3);
  assert.deepEqual(rows[0], { fund: "LankaBangla 1st Balanced Unit Fund", date: "2016-11-03", nav: 10.11 });
  assert.deepEqual(rows[2], { fund: "LankaBangla 1st Balanced Unit Fund", date: "2026-11-12", nav: 11.65 });
});

/* ── LankaBangla roster table ─────────────────────────────────────────────── */

const lankabdHtml = `
<div>NAV Per Unit at Market Price is as on October 19, 2026</div>
<table>
<thead><tr><td>NAV Per Unit</td><td>Selling Price</td><td>Repurchase Price</td><td>Entry Load</td><td>Exit Load</td>
<td>NAV Return YTD</td><td>NAV Return Previous Year</td><td>Weekly NAV Change</td><td>Latest Dividend</td>
<td>Dividend to Selling Price</td><td>AUM in Million</td><td>Inception</td></tr></thead>
<tbody>
<tr><td>IDLC Asset Management Limited</td></tr>
<tr><td><a href="/MF/Overview?mfid=2&mfname=IDLC%20GROWTH%20FUND">IDLC GROWTH FUND</a></td>
<td> 12.88 </td><td> 12.88 </td><td> 12.88 </td><td> 0.00% </td><td> 0.00% </td><td> 3.00% </td>
<td> -9.30% </td><td> -1.20% </td><td> 0.00% </td><td> 0.00% </td><td> 710 </td><td>Mar-19</td></tr>
<tr><td><a href="/MF/Overview?mfid=3&mfname=SOME%20FUND">SOME FUND</a></td>
<td> n/a </td><td> n/a </td><td> n/a </td><td> n/a </td><td> n/a </td><td> n/a </td>
<td> n/a </td><td> n/a </td><td> n/a </td><td> n/a </td><td> n/a </td><td>n/a</td></tr>
</tbody></table>`;

test("parseLankabdTable groups funds under their AMC and parses n/a as null", () => {
  const roster = parseLankabdTable(lankabdHtml, "2026-11-11");
  assert.equal(roster.asOf, "2026-10-19");
  assert.equal(roster.funds.length, 2);

  const growth = roster.funds[0];
  assert.equal(growth.amc, "IDLC Asset Management Limited");
  assert.equal(growth.mfid, "2");
  assert.equal(growth.name, "IDLC GROWTH FUND");
  assert.equal(growth.nav, 12.88);
  assert.equal(growth.repurchasePrice, 12.88);
  assert.equal(growth.navReturnYtdPct, 3);
  assert.equal(growth.navReturnPrevYearPct, -9.3);
  assert.equal(growth.weeklyChangePct, -1.2);
  assert.equal(growth.aumMillion, 710);
  assert.equal(growth.inception, "Mar-19");

  const missing = roster.funds[1];
  assert.equal(missing.nav, null);
  assert.equal(missing.aumMillion, null);
  assert.equal(missing.inception, "n/a");
});
