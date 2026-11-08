import type { FundSeed } from "@/lib/types";

/**
 * Profithisab fund catalog — Bangladesh open-end mutual funds.
 *
 * The anchor figures below (3-yr annualized, since-launch, worst NAV fall, fee, AUM,
 * AMC-verified status) mirror each fund's published history as of 2026-10-29, so the
 * demo site displays the market as it *actually* stood. The month-by-month NAV series
 * is reconstructed on the fly by src/lib/engine.ts so that its:
 *   - 3-year window compounds to `g3`
 *   - tracked window compounds to `gSince`
 *   - largest drawdown lands near `worstFall`
 * See README.md → "Updating funds & data" for how to swap in raw NAV series.
 */
export const FUNDS: FundSeed[] = [
  // ─── Growth ────────────────────────────────────────────────────────────────
  { slug: "ekush-growth-fund", name: "Ekush Growth Fund", acronym: "EGF", amc: "Ekush", amcSlug: "ekush", type: "growth", shariah: false, verified: false, inception: "2021-10", g3: 13.88, gSince: 8.63, worstFall: -9.7, fee: 2.5, aumCr: 33, divAnnualPct: 2, divMonths: [1], minTaka: 5000 },
  { slug: "edge-bangladesh-mutual-fund", name: "EDGE Bangladesh Mutual Fund", acronym: "EDGEBDMF", amc: "EDGE", amcSlug: "edge", type: "growth", shariah: false, verified: true, inception: "2018-08", g3: 12.63, gSince: 9.42, worstFall: -11.3, fee: 2.5, aumCr: 22, divAnnualPct: 3, divMonths: [1], minTaka: 5000 },
  { slug: "edge-amc-growth-fund", name: "EDGE AMC Growth Fund", acronym: "EDGEAMCGF", amc: "EDGE", amcSlug: "edge", type: "growth", shariah: false, verified: true, inception: "2019-09", g3: 12.54, gSince: 10.21, worstFall: -11.0, fee: 2.5, aumCr: 48, divAnnualPct: 2, divMonths: [1], minTaka: 5000 },
  { slug: "vipb-sebl-1st-unit-fund", name: "VIPB SEBL 1st Unit Fund", acronym: "VIPBSEBL1", amc: "VIPB", amcSlug: "vipb", type: "growth", shariah: false, verified: true, inception: "2011-05", g3: 9.58, gSince: 9.8, worstFall: -14.0, fee: 2.5, aumCr: 81, divAnnualPct: 4, divMonths: [1], minTaka: 5000 },
  { slug: "vipb-nli-1st-unit-fund", name: "VIPB NLI 1st Unit Fund", acronym: "VIPBNLI1", amc: "VIPB", amcSlug: "vipb", type: "growth", shariah: false, verified: true, inception: "2012-02", g3: 9.47, gSince: 9.99, worstFall: -13.6, fee: 2.5, aumCr: 53, divAnnualPct: 4, divMonths: [1], minTaka: 5000 },
  { slug: "bcb-icl-growth-fund", name: "BCB ICL Growth Fund", acronym: "BCBICLGF", amc: "ICL", amcSlug: "icl", type: "growth", shariah: false, verified: true, inception: "2018-04", g3: 9.13, gSince: 5.45, worstFall: -12.4, fee: 2.5, aumCr: 19, divAnnualPct: 0, divMonths: [], minTaka: 5000 },
  { slug: "vipb-growth-fund", name: "VIPB Growth Fund", acronym: "VIPBGF", amc: "VIPB", amcSlug: "vipb", type: "growth", shariah: false, verified: true, inception: "2018-03", g3: 8.89, gSince: 6.18, worstFall: -14.2, fee: 2.5, aumCr: 19, divAnnualPct: 4, divMonths: [1], minTaka: 5000 },
  { slug: "idlc-growth-fund", name: "IDLC Growth Fund", acronym: "IGF", amc: "IDLC", amcSlug: "idlc", type: "growth", shariah: false, verified: false, inception: "2019-07", g3: 8.58, gSince: 7.87, worstFall: -12.0, fee: 2.5, aumCr: 96, divAnnualPct: 4, divMonths: [1], minTaka: 5000 },
  { slug: "cwt-emerging-bangladesh-first-growth-fund", name: "CWT Emerging Bangladesh First Growth Fund", acronym: "CWTEBFGF", amc: "CWT", amcSlug: "cwt", type: "growth", shariah: false, verified: false, inception: "2019-12", g3: 8.53, gSince: 14.63, worstFall: -12.2, fee: 2.5, aumCr: 5, divAnnualPct: 2, divMonths: [1], minTaka: 5000 },
  { slug: "cwt-opportunities-fund", name: "CWT Opportunities Fund", acronym: "CWTOF", amc: "CWT", amcSlug: "cwt", type: "growth", shariah: false, verified: false, inception: "2021-06", g3: 8.05, gSince: 5.93, worstFall: -12.9, fee: 2.5, aumCr: 5, divAnnualPct: 2, divMonths: [1], minTaka: 5000 },
  { slug: "esquire-icl-apparel-fund", name: "Esquire ICL Apparel Fund", acronym: "EICLAF", amc: "ICL", amcSlug: "icl", type: "growth", shariah: false, verified: true, inception: "2019-08", g3: 7.57, gSince: 8.12, worstFall: -14.0, fee: 2.5, aumCr: 6, divAnnualPct: 3, divMonths: [1], minTaka: 5000 },
  { slug: "cwt-sadharan-bima-growth-fund", name: "CWT Sadharan Bima Growth Fund", acronym: "CWTSBGF", amc: "CWT", amcSlug: "cwt", type: "growth", shariah: false, verified: false, inception: "2020-09", g3: 7.15, gSince: 11.28, worstFall: -14.9, fee: 2.5, aumCr: 7, divAnnualPct: 2, divMonths: [1], minTaka: 5000 },
  { slug: "idlc-aml-shariah-fund", name: "IDLC AML Shariah Fund", acronym: "IAMLSF", amc: "IDLC", amcSlug: "idlc", type: "growth", shariah: true, verified: false, inception: "2019-12", g3: 2.8, gSince: 5.04, worstFall: -10.0, fee: 2.5, aumCr: 87, divAnnualPct: 3, divMonths: [1], minTaka: 5000 },
  { slug: "cwt-community-bank-shariah-fund", name: "CWT Community Bank Shariah Fund", acronym: "CWTCBSF", amc: "CWT", amcSlug: "cwt", type: "growth", shariah: true, verified: false, inception: "2023-10", g3: 1.93, gSince: 1.87, worstFall: null, fee: 2.5, aumCr: 6, divAnnualPct: 0, divMonths: [], minTaka: 5000 },
  { slug: "ucb-taqwa-growth-fund", name: "UCB Taqwa Growth Fund", acronym: "UCBTGF", amc: "UCB", amcSlug: "ucb", type: "growth", shariah: true, verified: false, inception: "2022-04", g3: 1.25, gSince: 1.74, worstFall: -8.1, fee: 2.5, aumCr: 17, divAnnualPct: 3, divMonths: [1], minTaka: 5000 },
  { slug: "shanta-first-income-unit-fund", name: "Shanta First Income Unit Fund", acronym: "SFIUF", amc: "Shanta", amcSlug: "shanta", type: "growth", shariah: false, verified: false, inception: "2018-03", g3: -1.55, gSince: 6.72, worstFall: -23.3, fee: 2.5, aumCr: 82, divAnnualPct: 4, divMonths: [1], minTaka: 5000 },
  { slug: "shanta-amanah-shariah-fund", name: "Shanta Amanah Shariah Fund", acronym: "SASF", amc: "Shanta", amcSlug: "shanta", type: "growth", shariah: true, verified: false, inception: "2019-02", g3: -2.26, gSince: 4.39, worstFall: -17.9, fee: 2.5, aumCr: 62, divAnnualPct: 3, divMonths: [1], minTaka: 5000 },
  { slug: "hfaml-shariah-unit-fund", name: "HFAML Shariah Unit Fund", acronym: "HFSUF", amc: "HF AML", amcSlug: "hfaml", type: "growth", shariah: true, verified: false, inception: "2022-03", g3: -3.91, gSince: -1.66, worstFall: -18.6, fee: 2.5, aumCr: 18, divAnnualPct: 3, divMonths: [1], minTaka: 5000 },
  { slug: "hfaml-acme-employees-unit-fund", name: "HFAML-ACME Employees' Unit Fund", acronym: "HFACMEUF", amc: "HF AML", amcSlug: "hfaml", type: "growth", shariah: false, verified: false, inception: "2019-07", g3: -5.51, gSince: 4.41, worstFall: -23.7, fee: 2.5, aumCr: 13, divAnnualPct: 3, divMonths: [1], minTaka: 5000 },
  { slug: "hfaml-unit-fund", name: "HFAML Unit Fund", acronym: "HFUF", amc: "HF AML", amcSlug: "hfaml", type: "growth", shariah: false, verified: false, inception: "2019-07", g3: -6.5, gSince: 1.62, worstFall: -24.5, fee: 2.5, aumCr: 16, divAnnualPct: 3, divMonths: [1], minTaka: 5000 },

  // ─── Balanced ──────────────────────────────────────────────────────────────
  { slug: "ekush-first-unit-fund", name: "Ekush First Unit Fund", acronym: "EFUF", amc: "Ekush", amcSlug: "ekush", type: "balanced", shariah: false, verified: false, inception: "2019-11", g3: 12.85, gSince: 12.55, worstFall: -9.7, fee: 2.5, aumCr: 37, divAnnualPct: 3, divMonths: [1, 7], minTaka: 5000 },
  { slug: "idlc-balanced-fund", name: "IDLC Balanced Fund", acronym: "IBF", amc: "IDLC", amcSlug: "idlc", type: "balanced", shariah: false, verified: false, inception: "2019-07", g3: 10.07, gSince: 8.24, worstFall: -13.8, fee: 2.5, aumCr: 60, divAnnualPct: 4, divMonths: [1, 7], minTaka: 5000 },
  { slug: "vipb-balanced-fund", name: "VIPB Balanced Fund", acronym: "VIPBBF", amc: "VIPB", amcSlug: "vipb", type: "balanced", shariah: false, verified: true, inception: "2020-12", g3: 10.06, gSince: 8.87, worstFall: -13.8, fee: 2.5, aumCr: 11, divAnnualPct: 4, divMonths: [1, 7], minTaka: 5000 },
  { slug: "icl-balanced-fund", name: "ICL Balanced Fund", acronym: "ICLBF", amc: "ICL", amcSlug: "icl", type: "balanced", shariah: false, verified: true, inception: "2016-08", g3: 7.79, gSince: 6.07, worstFall: -13.2, fee: 2.5, aumCr: 16, divAnnualPct: 3, divMonths: [1, 7], minTaka: 5000 },
  { slug: "edge-al-amin-shariah-consumer-fund", name: "EDGE Al-Amin Shariah Consumer Fund", acronym: "EDGEALAMIN", amc: "EDGE", amcSlug: "edge", type: "balanced", shariah: true, verified: true, inception: "2022-09", g3: 6.02, gSince: 4.35, worstFall: -9.0, fee: 2.5, aumCr: 13, divAnnualPct: 2, divMonths: [1, 7], minTaka: 5000 },
  { slug: "lankabangla-1st-balanced-unit-fund", name: "LankaBangla 1st Balanced Unit Fund", acronym: "LB1stBUF", amc: "LankaBangla", amcSlug: "lankabangla", type: "balanced", shariah: false, verified: false, inception: "2016-11", g3: 5.2, gSince: 7.41, worstFall: -11.1, fee: 2.5, aumCr: 37, divAnnualPct: 4, divMonths: [1, 7], minTaka: 5000 },
  { slug: "lb-gratuity-opportunities-fund", name: "LB Gratuity Opportunities Fund", acronym: "LBGOF", amc: "LankaBangla", amcSlug: "lankabangla", type: "balanced", shariah: false, verified: false, inception: "2020-12", g3: 5.19, gSince: 7.82, worstFall: -19.9, fee: 2.5, aumCr: 10, divAnnualPct: 4, divMonths: [1, 7], minTaka: 5000 },
  { slug: "ucb-aml-first-mutual-fund", name: "UCB AML First Mutual Fund", acronym: "UCBAFML1", amc: "UCB", amcSlug: "ucb", type: "balanced", shariah: false, verified: false, inception: "2021-04", g3: 3.43, gSince: 3.13, worstFall: -17.9, fee: 2.5, aumCr: 22, divAnnualPct: 5, divMonths: [1, 7], minTaka: 5000 },
  { slug: "icl-inctl-shariah-fund", name: "ICL INCTL Shariah Fund", acronym: "ICLINCTL", amc: "ICL", amcSlug: "icl", type: "balanced", shariah: true, verified: true, inception: "2023-12", g3: 1.9, gSince: 1.9, worstFall: null, fee: 2.5, aumCr: 8, divAnnualPct: 0, divMonths: [], minTaka: 5000 },
  { slug: "lankabangla-al-arafah-shariah-unit-fund", name: "LankaBangla Al-Arafah Shariah Unit Fund", acronym: "LBASUF", amc: "LankaBangla", amcSlug: "lankabangla", type: "balanced", shariah: true, verified: false, inception: "2018-04", g3: 1.57, gSince: 2.61, worstFall: -16.6, fee: 2.5, aumCr: 29, divAnnualPct: 4, divMonths: [1, 7], minTaka: 5000 },
  { slug: "lb-gratuity-wealth-builder-fund", name: "LB Gratuity Wealth Builder Fund", acronym: "LBGWBF", amc: "LankaBangla", amcSlug: "lankabangla", type: "balanced", shariah: false, verified: false, inception: "2021-08", g3: -0.17, gSince: 2.05, worstFall: -22.6, fee: 2.5, aumCr: 7, divAnnualPct: 4, divMonths: [1, 7], minTaka: 5000 },

  // ─── Income ────────────────────────────────────────────────────────────────
  { slug: "ekush-stable-return-fund", name: "Ekush Stable Return Fund", acronym: "ESRF", amc: "Ekush", amcSlug: "ekush", type: "income", shariah: false, verified: false, inception: "2022-09", g3: 13.77, gSince: 11.31, worstFall: -2.4, fee: 2.5, aumCr: 80, divAnnualPct: 0, divMonths: [], minTaka: 5000 },
  { slug: "ucb-income-plus-fund", name: "UCB Income Plus Fund", acronym: "UCBIPF", amc: "UCB", amcSlug: "ucb", type: "income", shariah: false, verified: false, inception: "2023-07", g3: 13.63, gSince: 13.05, worstFall: -4.0, fee: 0.7, aumCr: 377, divAnnualPct: 0, divMonths: [], minTaka: 5000 },
  { slug: "shanta-fixed-income-fund", name: "Shanta Fixed Income Fund", acronym: "SFIF", amc: "Shanta", amcSlug: "shanta", type: "income", shariah: false, verified: false, inception: "2021-08", g3: 12.76, gSince: 8.28, worstFall: -3.7, fee: 2.5, aumCr: 360, divAnnualPct: 0, divMonths: [], minTaka: 5000 },
  { slug: "edge-high-quality-income-fund", name: "EDGE High Quality Income Fund", acronym: "EDGEHQIF", amc: "EDGE", amcSlug: "edge", type: "income", shariah: false, verified: true, inception: "2022-02", g3: 12.38, gSince: 9.83, worstFall: -5.1, fee: 1.0, aumCr: 94, divAnnualPct: 0, divMonths: [], minTaka: 5000 },
  { slug: "idlc-income-fund", name: "IDLC Income Fund", acronym: "IIF", amc: "IDLC", amcSlug: "idlc", type: "income", shariah: false, verified: false, inception: "2021-06", g3: 9.85, gSince: 8.76, worstFall: -4.8, fee: 0.7, aumCr: 102, divAnnualPct: 0, divMonths: [], minTaka: 5000 },
  { slug: "vipb-accelerated-income-unit-fund", name: "VIPB Accelerated Income Unit Fund", acronym: "VIPBAIF", amc: "VIPB", amcSlug: "vipb", type: "income", shariah: false, verified: true, inception: "2016-07", g3: 9.07, gSince: 7.66, worstFall: -14.9, fee: 2.5, aumCr: 32, divAnnualPct: 10, divMonths: [1, 7], minTaka: 5000 },
  { slug: "vipb-fixed-income-fund", name: "VIPB Fixed Income Fund", acronym: "VIPBFI", amc: "VIPB", amcSlug: "vipb", type: "income", shariah: false, verified: true, inception: "2024-09", g3: null, gSince: 19.75, worstFall: null, fee: 2.5, aumCr: 30, divAnnualPct: 5, divMonths: [1, 7], minTaka: 5000 },
];

export const AMC_LABELS: Record<string, string> = {
  ekush: "Ekush",
  edge: "EDGE",
  cwt: "CWT",
  vipb: "VIPB",
  icl: "ICL",
  idlc: "IDLC",
  shanta: "Shanta",
  lankabangla: "LankaBangla",
  ucb: "UCB",
  hfaml: "HF AML",
};

/** Funds whose published launch precedes our tracked data window (Jan 2026 data-cutoff guard → we track from 2018-08). */
export const DATA_WINDOW_START = "2018-08";
