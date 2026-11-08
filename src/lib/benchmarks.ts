/**
 * Reference instruments for context lines. Rates encoded as monthly factors so any
 * horizon can compound them identically to fund series. Replace rates in one place
 * when certificates/FDR repricing changes (README → "Updating benchmarks").
 * Sources are documented in /methodology.
 */

export type BenchSlug = "sanchay3" | "fdr" | "inflation" | "gold" | "dsex";

export interface Bench {
  slug: BenchSlug;
  name: string;
  short: string;
  color: string;
  /** Annualized % used for quick context chips. */
  ann: { g3: number; g5: number };
  note: string;
}

export const BENCHES: Bench[] = [
  {
    slug: "sanchay3",
    name: "Sanchayapatra (3-yr, par)",
    short: "Sanchayapatra",
    color: "#6366f1",
    ann: { g3: 11.28, g5: 11.94 },
    note: "Published 3-year certificate rate compounded without withdrawals; source tax on interest varies by buyer category and is not netted here.",
  },
  {
    slug: "fdr",
    name: "Bank fixed deposit (~10%)",
    short: "FDR",
    color: "#0ea5e9",
    ann: { g3: 10.0, g5: 10.0 },
    note: "A working average of scheduled-bank FDR rates over the window; renegotiated rates are simplified to one flat rate.",
  },
  {
    slug: "inflation",
    name: "Inflation (CPI)",
    short: "Inflation",
    color: "#f59e0b",
    ann: { g3: 9.1, g5: 9.3 },
    note: "General CPI path (BBS), tapering from ~9.8% in 2023-24 to ~8% by 2026 in this dataset.",
  },
  {
    slug: "gold",
    name: "Gold (৳ per tola)",
    short: "Gold",
    color: "#eab308",
    ann: { g3: 18.0, g5: 17.0 },
    note: "Indicative taka price path including strong post-2022 appreciation; no storage or making charges.",
  },
  {
    slug: "dsex",
    name: "DSEX (market)",
    short: "DSEX",
    color: "#8b5cf6",
    ann: { g3: 1.6, g5: 0.9 },
    note: "Price index path used for beta and market context. Dividend yield of the market is not included.",
  },
];

/** Monthly factor per instrument for the shared market window. */
export function benchMonthlyLog(slug: BenchSlug, monthIdx: number, allMonths: string[]): number {
  const iso = allMonths[monthIdx];
  if (!iso) return 0;
  switch (slug) {
    case "sanchay3":
      return Math.log(1 + 11.28 / 100) / 12;
    case "fdr":
      return Math.log(1 + 10.0 / 100) / 12;
    case "inflation": {
      // Tapering CPI path: 9.8% (2023) → 8.0% (2026)
      const y = Number(iso.split("-")[0]);
      const rate = y <= 2022 ? 6.9 : y === 2023 ? 9.6 : y === 2024 ? 9.7 : y === 2025 ? 9.0 : 8.2;
      return Math.log(1 + rate / 100) / 12;
    }
    case "gold":
      return Math.log(1 + 18.0 / 100) / 12;
    case "dsex":
      return 0; // handled via MARKET_LOG_R (levels)
    default:
      return 0;
  }
}

export function benchBySlug(slug: BenchSlug): Bench {
  return BENCHES.find((b) => b.slug === slug) ?? BENCHES[0];
}
