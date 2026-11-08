import type { Post } from "@/components/content/blocks";

export const POSTS: Post[] = [
  {
    slug: "october-2026-open-end-fund-rankings",
    title: "October 2026: every tracked open-end fund, one honest window",
    description:
      "The 3-year table as of 29 Oct 2026: which funds led, which trailed, how many beat Sanchayapatra — and why most league tables you see elsewhere are unfalsifiable.",
    date: "2026-10-29",
    keywords: ["mutual fund rankings Bangladesh October 2026", "best mutual fund Bangladesh 2026"],
    blocks: [
      { t: "p", md: "Every month the fixed 3-year window rolls forward one month and every fund gets re-scored on the same clock — no promotion dates, no start-date shopping. As of 29 October 2026:" },
      { t: "rank", source: "g3", n: 10, title: "Top 10 by fixed 3-year total return (one-time, dividends reinvested)" },
      { t: "p", md: "The leaders are, as they have been for several windows, a small club of equity and high-conviction balanced funds compounding in the low double digits while the certificate sits at ~11.3% and FDRs near 10%. Fewer than a third of the tracked funds cleared inflation comfortably; fewer still cleared the certificate. The market's message in one sentence: *fee-hating patience is the only consistent edge available to retail buyers here*." },
      { t: "h2", text: "What actually changed this month" },
      { t: "ul", items: [
        "The window's 2024 crash months (NAV drawdowns of −15% to −25% on equity-heavy books) fully entered the 3-year clock for the first time last year — and still dominate the ceiling for every fund's worst-fall stat.",
        "Income funds cluster at 9–14%: boring, bond-driven, occasionally beating the certificate, and usually cheaper by fee.",
        "A couple of single-name-story funds posted strong numbers; we keep their pages factual, not adulatory.",
      ] },
      { t: "rank", source: "sip3", n: 5, title: "Best ৳5,000/month SIP outcomes across the same window" },
      { t: "p", md: "The SIP leaderboard rewards funds that drew down *while* investors were still cash-flowing in, then recovered — automatic taka-cost averaging at work. Notice the overlap with the one-time table is partial: same fund, different arithmetic, and both belong on your dashboard." },
      { t: "h2", text: "Why this table is harder to fake" },
      { t: "p", md: "Because the method is boring and public: one window, all NAVs published, dividends reinvested, fees disclosed. You can rebuild every row yourself from our methodology page. If a fund's marketing table uses different numbers, ask it when its window opened." },
      { t: "cta", href: "/guides/best-mutual-funds-bangladesh", label: "See the full leaderboard →" },
    ],
  },
  {
    slug: "sip-replay-2023-2026-taka-5000",
    title: "What ৳5,000 a month since 2023 would actually have done",
    description:
      "A sober replay of a ৳5,000 monthly SIP across the tracked funds between late 2023 and October 2026 — including the crash dip most fund pages politely crop out.",
    date: "2026-10-31",
    keywords: ["SIP calculator Bangladesh", "5000 taka SIP", "mutual fund SIP result BD"],
    blocks: [
      { t: "p", md: "Put ৳5,000 into each tracked fund every month-end from late 2023 through 29 October 2026 — 36 instalments, ৳1,80,000 total — dividends reinvested throughout. The spread tells the story of this market better than any headline." },
      { t: "rank", source: "sip3", n: 10, title: "SIP outcomes per fund (money-weighted, 36 months)" },
      { t: "h2", text: "The dip every SIP lived through" },
      { t: "p", md: "Mid-2024, the market cracked roughly a fifth of its value from the prior peak — funds' worst falls run from −8% (income) to −25% (equity-heavy, unhedged, no shelter). Monthly buyers kept buying: that's why several equity funds' SIP returns ran *ahead* of their one-time CAGRs. The uncomfortable corollary: the SIP shield only works if you genuinely keep the mandate running during the angry months." },
      { t: "h2", text: "The three conclusions worth carrying" },
      { t: "ol", items: [
        "*Consistency of process beats brilliance of entry.* Spread across months, the timing edge evaporates as expected — good funds from bad are separated by fees and portfolio conduct, not by your start date.",
        "*Dividends are the quiet double agent.* Income funds in this window compound differently once each dividend buys units; the DRIP column on fund pages is real money.",
        "*The certificate still sets the bar.* ~11.3%/yr, no drawdown, and an implicit sovereign promise. Fund buyers must accept volatility to justify it; SIP buyers especially need the decade, not the 3-year scoreboard.",
      ] },
      { t: "callout", title: "Try it with your amount", md: "The homepage calculator runs the same engine on any amount, monthly or one-time, with the Shariah-only switch. Same data, your numbers.", tone: "brand" },
      { t: "cta", href: "/", label: "Run your own replay →" },
    ],
  },
];
