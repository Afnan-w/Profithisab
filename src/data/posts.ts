import type { Post } from "@/components/content/blocks";

/**
 * Blog posts are deliberately evergreen. They may sort live data, but they do
 * not hard-code a ranking, a date, a fund count, or a market story: those come
 * from /data and would otherwise go stale the moment a NAV is imported.
 */
export const POSTS: Post[] = [
  {
    slug: "reading-a-fund-league-table",
    title: "How to read a mutual fund league table without being fooled",
    description:
      "Same window, dividends reinvested, published NAVs only: how the 3-year table is built, and the questions to ask any other table you see.",
    date: "2026-10-29",
    keywords: ["mutual fund rankings Bangladesh", "best mutual fund Bangladesh"],
    blocks: [
      {
        t: "p",
        md: "A league table looks authoritative because it shows a lot of decimals. The decimals are not the point. The point is the *window*: which start date, which end date, and whether dividends were counted. Change any one of those and the ranking can change.",
      },
      {
        t: "rank",
        source: "g3",
        n: 10,
        title: "Top 10 by fixed 3-year total return (one-time, dividends reinvested)",
      },
      {
        t: "p",
        md: "This table is recomputed from the NAV files in the repository every time the site is built. If a fund has fewer than three years of published history, it is left out rather than given a shorter, flattering window. If its latest NAV is more than 30 days old, it is marked stale and excluded from rankings.",
      },
      { t: "h2", text: "Three questions to ask any fund table" },
      {
        t: "ul",
        items: [
          "*What window?* A 3-year number and a since-launch number answer different questions. Neither is wrong; mixing them in one column is.",
          "*Are dividends included?* A growth fund's NAV already reflects its gains. An income fund may pay out most of its return as dividends, so ignoring them understates it.",
          "*Is the comparison like-for-like?* A fixed-income fund and an equity fund do not carry the same risk. Put the worst fall next to the return before drawing a conclusion.",
        ],
      },
      { t: "h2", text: "Why this table can be rebuilt" },
      {
        t: "p",
        md: "The method is boring and public: one window, all published NAVs, dividends reinvested at the first available NAV on or after the record date, and fees shown separately. The methodology page lists the formulas. The data-status page lists every file, its latest NAV and anything waiting for review.",
      },
      {
        t: "cta",
        href: "/methodology",
        label: "Read the formulas →",
      },
    ],
  },
  {
    slug: "sip-versus-lump-sum-the-arithmetic",
    title: "SIP or lump sum? The arithmetic, not the slogan",
    description:
      "A monthly replay and a one-time investment can produce different annualised numbers from the same NAV history. Here is why both belong on your dashboard.",
    date: "2026-10-31",
    keywords: ["SIP calculator Bangladesh", "mutual fund SIP result BD"],
    blocks: [
      {
        t: "p",
        md: "A ৳5,000 monthly SIP and a single ৳1,00,000 lump sum are not rival religions. They are two cash-flow patterns. The same fund can look better under one and worse under the other, because the timing of each taka changes the money-weighted return.",
      },
      {
        t: "rank",
        source: "sip3",
        n: 10,
        title: "SIP outcomes per fund (money-weighted, trailing 3 years)",
      },
      { t: "h2", text: "Money-weighted versus time-weighted" },
      {
        t: "p",
        md: "A lump-sum CAGR asks: what annual rate turned the starting value into the ending value? A SIP XIRR asks: what annual rate makes the dated contributions and the final value balance? They use the same NAVs but different arithmetic, so they can rank funds differently.",
      },
      {
        t: "ul",
        items: [
          "*Lump sum* is sensitive to the start date. Buy before a fall and the annualised number suffers, even if the fund recovers later.",
          "*SIP* is sensitive to the path. Monthly purchases accumulate more units when prices are low, which can lift the money-weighted return without changing the fund's long-run CAGR.",
          "*Neither* is a forecast. Both describe a window that has already closed.",
        ],
      },
      {
        t: "callout",
        title: "Try it with your amount",
        md: "The homepage calculator runs the same arithmetic on any amount, monthly or one-time, with a dividends toggle and a Shariah-only switch. Same data, your numbers.",
        tone: "brand",
      },
      { t: "cta", href: "/", label: "Run your own replay →" },
    ],
  },
];
