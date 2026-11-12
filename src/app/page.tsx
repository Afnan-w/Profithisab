import Link from "next/link";
import type { Metadata } from "next";
import Calculator from "@/components/calc/calculator";
import { FundCard } from "@/components/funds/fund-card";
import { BenchBars } from "@/components/charts/bench-bars";
import { RankedBars } from "@/components/charts/ranked-bars";
import { JsonLd } from "@/components/seo/jsonld";
import { faqPageSchema } from "@/lib/seo";
import { site } from "@/lib/site";
import {
  ALL_FUNDS,
  BENCHES,
  IS_DEMO,
  META,
  STATS,
  calculatorFunds,
  metricsFor,
  rankedFunds,
} from "@/lib/returns";
import { fullDate, pct } from "@/lib/format";

export const metadata: Metadata = {
  title: "Profithisab | Real Returns of Bangladeshi Mutual Funds",
  description:
    `What would ৳5,000 a month — or ৳1,00,000 once — have actually become in Bangladeshi mutual funds? Profithisab replays the NAV history in its committed data files, with dividends reinvested and every gap shown. ${STATS.funds} funds tracked.`,
  alternates: { canonical: "/" },
  openGraph: {
    title: "Profithisab | Real Returns of Bangladeshi Mutual Funds",
    description: `Replay Bangladeshi open-end fund NAV history. ${STATS.funds} funds, one honest method, every source and gap shown.`,
  },
};

const HOME_FAQ = [
  {
    q: "What exactly does Profithisab show?",
    a: "It replays the NAV and dividend history in our data files and answers one question: if you had invested a chosen amount — monthly (SIP) or one time — what would that money be worth at the latest published NAV, with dividends reinvested or kept as cash?",
  },
  {
    q: "Where does the data come from?",
    a: IS_DEMO
      ? "This build is running on a clearly labelled demo dataset. It is generated to test layout and arithmetic, not to publish fund performance. The real import pipeline is ready; when a licensed export is added, the demo banner disappears."
      : "From the NAV and dividend files committed in this repository. Every fund page shows its source, its latest NAV date and whether the series is complete, partial or missing. The methodology page documents every formula.",
  },
  {
    q: "Why do you show several windows?",
    a: "A single window can flatter or punish a fund by accident. We compute 1-year, 3-year, 5-year and since-launch figures from the same history, then say plainly when a fund is too young for a window. There is no per-fund start date.",
  },
  {
    q: "Is this investment advice?",
    a: "No. Profithisab is a research tool. It shows what the past did, not what the future will do — and past mutual fund performance in Bangladesh has often looked very different from the future.",
  },
  {
    q: "Are dividends included?",
    a: "Yes. The default is total return: each dividend buys more units at the first published NAV on or after the record date. You can switch to cash dividends in the calculator. 'Worst fall' measures NAV alone, without the dividend cushion.",
  },
];

export default function HomePage() {
  const top = rankedFunds("3y").slice(0, 6);
  const ranked = ALL_FUNDS.filter((f) => metricsFor(f.slug).g3 !== null);
  const leaders = [...ranked]
    .sort((a, b) => (metricsFor(b.slug).g3 ?? -99) - (metricsFor(a.slug).g3 ?? -99))
    .slice(0, 6);
  const laggards = [...ranked]
    .sort((a, b) => (metricsFor(a.slug).g3 ?? 99) - (metricsFor(b.slug).g3 ?? 99))
    .slice(0, 3);
  const sanch = BENCHES.find((b) => b.slug === "sanchayapatra");
  const with3y = ranked.length;

  const benchmarkItems = BENCHES.filter((b) => b.status !== "unavailable" && b.annualRate !== null).map((b) => ({
    label: b.short,
    value: b.annualRate as number,
    color: b.color,
  }));

  return (
    <>
      <JsonLd objects={[faqPageSchema(HOME_FAQ)]} />

      {/* ── Hero ── */}
      <section className="border-b border-line">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 pt-14 pb-12 sm:px-6 lg:grid-cols-[1.05fr_auto] lg:items-start">
          <div className="max-w-2xl">
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">
              {site.tagline}
            </p>
            <h1 className="mt-3 max-w-xl text-balance text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
              If you had actually invested ৳10,000 — how much <span className="text-brand-600 dark:text-brand-400">labh</span> would you have now?
            </h1>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-muted">
              Profithisab replays the NAV and dividend history in its committed data files and shows, in black and
              white, what real money would have become. One method. Every window labelled. Zero sales talk.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <span className="chip"><strong className="text-fg">{STATS.funds}</strong> funds in this build</span>
              <span className="chip"><strong className="text-fg">{with3y}</strong> with a full 3-year window</span>
              <span className="chip"><strong className="text-fg">{STATS.amcs}</strong> asset managers</span>
              <span className="chip"><strong className="text-fg">{STATS.shariah}</strong> Shariah-compliant</span>
              {STATS.stale > 0 ? (
                <span className="chip"><strong className="text-fg">{STATS.stale}</strong> stale, excluded from rankings</span>
              ) : null}
            </div>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/funds" className="btn-cta">Browse the funds →</Link>
              <Link href="/compare" className="btn-quiet">Compare funds side by side</Link>
            </div>
            <p className="mt-6 text-xs text-faint">
              Free · No login · Latest NAV {fullDate(META.latestNavDate)} · Not investment advice
            </p>
          </div>

          <aside className="grid w-full max-w-md gap-3 justify-self-center sm:grid-cols-2 lg:max-w-sm">
            <MiniStat label="Funds with NAV" value={`${STATS.withNav} / ${STATS.funds}`} sub="the rest show as missing" />
            <MiniStat
              label="Data completeness"
              value={`${STATS.complete} complete`}
              sub={`${STATS.partial} partial · ${STATS.missing} missing`}
            />
            <MiniStat label="Latest published NAV" value={fullDate(META.latestNavDate)} sub="date shown on every fund" />
            <MiniStat
              label="Ranking rule"
              value="No stale funds"
              sub="30+ days without NAV means excluded"
            />
          </aside>
        </div>
      </section>

      {/* ── Calculator ── */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6" aria-labelledby="calc-head">
        <div className="mb-8 max-w-2xl">
          <h2 id="calc-head" className="text-2xl font-bold tracking-tight sm:text-3xl">
            The honest replay calculator
          </h2>
          <p className="mt-2 text-muted">
            Pick an amount, monthly or one-time, a window, and whether dividends are reinvested. The calculation uses
            the NAV history in our data files — not a hypothetical fixed return.
          </p>
        </div>
        <div className="card card-pad !p-5 sm:!p-6 elev">
          <Calculator
            funds={calculatorFunds()}
            benchmarks={BENCHES.map((b) => ({
              id: b.slug,
              name: b.name,
              shortName: b.short,
              annualRate: b.annualRate,
              status: b.status,
              color: b.color,
            }))}
            latestNavDate={META.latestNavDate}
            isDemo={IS_DEMO}
          />
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="border-y border-line">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-14 sm:px-6 md:grid-cols-3">
          {[
            ["A stated window", "Every headline names its window: 1, 3, 5 years or since launch. When a fund is too young for that window, the page says “Not enough history” instead of inventing a number."],
            ["Dividends handled explicitly", "Each dividend either buys more units at the first published NAV on or after the record date, or is kept as cash. You choose; the result says which."],
            ["Every gap visible", "Each fund shows its latest NAV date, row count and completeness. Funds with no NAV in the last 30 days are flagged and kept out of rankings."],
          ].map(([h, p]) => (
            <div key={h} className="reveal">
              <h3 className="font-semibold">{h}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{p}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Featured funds ── */}
      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6" aria-labelledby="feat-head">
        <div className="mb-6 flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h2 id="feat-head" className="text-2xl font-bold tracking-tight">The 3-year table, as it stands</h2>
            <p className="mt-1 max-w-xl text-sm text-muted">
              Sorted by one-time 3-year return per year, dividends reinvested. Only funds with a usable, non-stale
              3-year history appear. The laggards are equally visible on{" "}
              <Link className="underline decoration-dotted hover:text-fg" href="/funds">the full list</Link>.
            </p>
          </div>
          <Link href="/guides/best-mutual-funds-bangladesh" className="text-sm font-medium text-brand-600 hover:text-brand-700 dark:hover:text-brand-400">
            Full leaderboard →
          </Link>
        </div>
        {top.length ? (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {top.map((f) => (
              <div key={f.slug} className="reveal">
                <FundCard fund={f} />
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-line bg-raised p-5 text-sm text-muted">
            No fund has a usable 3-year history yet, so there is no honest ranking to show. Check{" "}
            <Link href="/data-status" className="underline decoration-dotted hover:text-fg">data status</Link> for what
            is missing.
          </p>
        )}

        {leaders.length ? (
          <div className="mt-10 card card-pad !p-4 sm:!p-5 elev">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="font-semibold">Where the whole 3-year roster sits</h3>
              <span className="text-[11px] text-faint">
                {sanch ? `Dashed line: ${sanch.short} ${sanch.annualRate?.toFixed(2)}%/yr (${sanch.status})` : "No benchmark rate loaded"}
              </span>
            </div>
            <RankedBars
              items={[
                ...leaders.map((f) => ({
                  label: f.name,
                  href: `/funds/${f.slug}`,
                  value: (metricsFor(f.slug).g3 ?? 0) * 100,
                  sub: f.acronym,
                })),
                ...laggards.map((f) => ({
                  label: f.name,
                  href: `/funds/${f.slug}`,
                  value: (metricsFor(f.slug).g3 ?? 0) * 100,
                  sub: `${f.acronym} · weakest 3-yr`,
                  color: "#dc2626",
                })),
              ]}
              benchmark={sanch?.annualRate ?? null}
              benchmarkLabel={sanch ? `${sanch.short} ${sanch.annualRate?.toFixed(1)}%/yr (${sanch.status})` : undefined}
            />
          </div>
        ) : null}
      </section>

      {/* ── Benchmarks ── */}
      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6" aria-labelledby="bench-head">
        <div className="card card-pad elev">
          <div className="grid gap-8 lg:grid-cols-[auto_1fr] lg:items-start">
            <div className="max-w-sm">
              <h2 id="bench-head" className="text-lg font-semibold">The rivals every fund has to beat</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                In Bangladesh the benchmark is not only other funds — it is the certificate in your neighbour&apos;s
                drawer. These are the rates currently loaded in <code>data/benchmarks.json</code>. Each line carries its
                own status: <em>verified</em> only with a citation, <em>approximate</em> as a working average, and
                <em>unavailable</em> when there is no honest series to draw.
              </p>
              <ul className="mt-3 space-y-1.5 text-xs text-faint">
                {BENCHES.map((b) => (
                  <li key={b.slug}>
                    · <strong className="text-muted">{b.short}</strong>{" "}
                    {b.status === "unavailable" ? "— unavailable, hidden from charts" : `— ${b.status}, ${b.annualRate?.toFixed(2)}%/yr`}
                  </li>
                ))}
              </ul>
            </div>
            <BenchBars items={benchmarkItems} />
          </div>
          <p className="mt-4 text-[11px] leading-relaxed text-faint">
            Gold is marked unavailable and is not drawn. DSEX and DSES use real month-end index closes (2018 →
            today), sourced from the exchange via Shanta AML's published pages — not a generated path.
          </p>
        </div>
      </section>

      {/* ── Learn ── */}
      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6" aria-labelledby="learn-head">
        <h2 id="learn-head" className="text-2xl font-bold tracking-tight">Learn the maths, dodge the marketing</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { href: "/guides/how-to-invest-in-mutual-funds-in-bangladesh", title: "How to invest in mutual funds in Bangladesh", sub: "BO account, KYC, SIP setup, redemption — step by step." },
            { href: "/guides/shariah-compliant-mutual-funds-bangladesh", title: "Shariah-compliant mutual funds", sub: "What “Halal-certified” actually means on paper." },
            { href: "/guides/best-mutual-funds-bangladesh", title: "Best mutual funds, ranked by data", sub: "The current table, rebuilt from the committed NAV history." },
            { href: "/guides/mutual-fund-tax-bangladesh", title: "Tax on mutual fund returns", sub: "Dividends, capital gains, and Sanchayapatra's 10% cut." },
          ].map((c) => (
            <Link key={c.href} href={c.href} className="card transition hover:border-brand-500 group">
              <div className="card-pad !p-4 sm:!p-5">
                <h3 className="font-semibold leading-snug group-hover:text-brand-700 dark:group-hover:text-brand-400 transition-colors">{c.title}</h3>
                <p className="mt-1.5 text-sm text-muted">{c.sub}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="mx-auto max-w-3xl px-4 pb-16 sm:px-6" aria-labelledby="faq-head">
        <h2 id="faq-head" className="text-2xl font-bold tracking-tight">Direct questions, direct answers</h2>
        <div className="mt-6 space-y-2">
          {HOME_FAQ.map((f) => (
            <details key={f.q} className="card group px-4 py-3 open:pb-4">
              <summary className="cursor-pointer list-none font-semibold marker:hidden">
                <span className="flex items-center justify-between gap-3">
                  {f.q}
                  <span className="text-faint transition group-open:rotate-45" aria-hidden="true">+</span>
                </span>
              </summary>
              <p className="mt-2 text-sm leading-relaxed text-muted">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* ── Invest band ── */}
      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <div className="card card-pad flex flex-col items-start justify-between gap-4 bg-brand-600 text-white sm:!p-8 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-xl font-bold">Numbers first. Then, if you want, buy units.</h2>
            <p className="mt-1 text-sm text-brand-50">
              Purchases happen with the fund&apos;s asset manager, an authorised agent or an investing app. Partners
              may pay us a referral fee — but they never pay for rankings or a single digit.
            </p>
          </div>
          <Link href="/invest" className="btn-quiet !bg-white/10 !border-white/30 !text-white hover:!bg-white/20">
            How investing works →
          </Link>
        </div>
      </section>
    </>
  );
}

function MiniStat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="card card-pad !p-4">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 text-xl font-bold tnum">{value}</p>
      {sub ? <p className="text-[11px] text-faint">{sub}</p> : null}
    </div>
  );
}
