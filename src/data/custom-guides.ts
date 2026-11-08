import type { Guide } from "@/components/content/blocks";

/** Custom-rendered guides (numbers computed live from the dataset). */
export interface CustomGuideDef {
  slug: string;
  title: string;
  description: string;
  published: string;
  updated?: string;
  keywords: string[];
}

export const CUSTOM_GUIDES: CustomGuideDef[] = [
  {
    slug: "best-mutual-funds-bangladesh",
    title: "The best mutual funds in Bangladesh — the 2026 data table",
    description:
      "Bangladesh's open-end funds ranked on one fixed 3-year window — total return per year, ৳5,000/month SIP outcomes, income leaders and the calmest rides. Recomputed from published NAV history every window-roll.",
    published: "2026-11-02",
    updated: "2026-11-02",
    keywords: ["best mutual funds Bangladesh 2026", "best SIP fund Bangladesh", "top performing mutual fund BD"],
  },
  {
    slug: "sanchayapatra-vs-mutual-funds",
    title: "Sanchayapatra vs mutual funds — decided by the numbers",
    description:
      "Government certificates pay ~11% with an implicit promise; mutual funds promise nothing. Put the same three years, taxes and fees on one table, count how many funds actually beat it, and choose your sleep level accordingly.",
    published: "2026-10-25",
    keywords: ["Sanchayapatra vs mutual fund", "best fixed income Bangladesh", "savings certificate return"],
  },
];

export function customGuideDef(slug: string): CustomGuideDef | undefined {
  return CUSTOM_GUIDES.find((g) => g.slug === slug);
}

export function asGuide(def: CustomGuideDef): Guide {
  return {
    ...def,
    kind: "custom",
    faqs: CUSTOM_FAQS[def.slug] ?? [],
  };
}

export const CUSTOM_FAQS: Record<string, Array<{ q: string; a: string }>> = {
  "best-mutual-funds-bangladesh": [
    {
      q: "Which is the best mutual fund in Bangladesh right now?",
      a: "On Profithisab's fixed 3-year window, the list is led by growth funds that compounded in the low double digits over the trailing 36 months — Ekush Growth, EDGE Bangladesh and Ekush First have historically crowded the top. 'Best' depends on your fee tolerance, drawdown appetite and Shariah screen; the tables show all four angles.",
    },
    {
      q: "How often do these rankings update?",
      a: "Every time the fixed window rolls along the NAV calendar. Because the window is identical for every fund and never 'conveniently chosen', consecutive updates are actually comparable — unlike marketing league tables.",
    },
    {
      q: "Can a fund that topped last year stay top next year?",
      a: "Rarely without help. Rankings over one window reward the window; check the 5-year row, the worst fall and the fee before assuming a streak is a skill.",
    },
  ],
  "sanchayapatra-vs-mutual-funds": [
    {
      q: "Is Sanchayapatra better than mutual funds in Bangladesh?",
      a: "For principal safety, at fixed horizons, this cycle — mostly yes, and recomputed monthly. Certificates pay ~11% with no drawdown; most tracked funds did not clear that over the same three years. Mutual funds exist for the long horizon, inflation-beating attempts and growth money you can leave untouched for years.",
    },
    {
      q: "How many mutual funds beat Sanchayapatra over 3 years?",
      a: "See the live table above — the count changes as the window rolls. In recent windows only a minority cleared the certificate's rate; the honest conclusion is not 'funds are scams', it's 'fees plus Bangladesh's market are a hard combination at a low-volatility price'.",
    },
  ],
};
