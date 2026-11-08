import Link from "next/link";
import type { Metadata } from "next";
import Calculator from "@/components/calc/calculator";
import { FundCard } from "@/components/funds/fund-card";
import { BenchBars } from "@/components/charts/bench-bars";
import { ALL_FUNDS, AMCs, TOTAL_AUM_CR, VERIFIED_COUNT, metricsFor } from "@/lib/returns";
import { BENCHES } from "@/lib/benchmarks";
import { JsonLd } from "@/components/seo/jsonld";
import { faqPageSchema } from "@/lib/seo";
import { site } from "@/lib/site";

export const metadata: Metadata = {
  title: "Profithisab | Real Returns of Bangladeshi Mutual Funds",
  description:
    "What would ৳5,000 a month — or ৳1,00,000 once — have actually become in Bangladeshi mutual funds? Profithisab replays published NAV history of 38 open-end funds with one fixed 3-year window, dividends reinvested, and no sales talk.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Profithisab | Real Returns of Bangladeshi Mutual Funds",
    description: "Replay real NAV history of 38 Bangladeshi open-end funds. One honest window. Dividends reinvested.",
  },
};

const HOME_FAQ = [
  {
    q: "What exactly does Profithisab show?",
    a: "It replays published NAV history of Bangladeshi open-end mutual funds and answers one question: if you had invested a chosen amount — monthly (SIP) or one time — what would that money be worth today, with dividends reinvested.",
  },
  {
    q: "Why is the window always 3 years and the same for every fund?",
    a: "Because comparisons are only fair when the scoreboard clocks run the same length. Every headline figure on Profithisab uses the same fixed 3-year window ending in the latest NAV month, so a 20% fund and a 2% fund are literally measuring the same three years.",
  },
  {
    q: "Is this investment advice?",
    a: "No. Profithisab is a research tool. It shows what the past did, not what the future will do — and in Bangladesh, past mutual fund performance has often looked very different from the future.",
  },
  {
    q: "Where does the data come from?",
    a: "From published NAV and dividend disclosures of the funds' asset managers (and the market feeds they report through). The methodology page documents every formula — there is no black box.",
  },
  {
    q: "Are dividends included in the returns?",
    a: "Yes. Headline returns assume dividends are reinvested (total return), which is how honest long-run figures are built. 'Worst fall' measures NAV alone, without dividend cushioning.",
  },
];

export default async function HomePage() {
  const top = ALL_FUNDS.filter((f) => metricsFor(f.slug).g3 !== null)
    .sort((a, b) => (metricsFor(b.slug).g3 ?? -99) - (metricsFor(a.slug).g3 ?? -99))
    .slice(0, 6);

  return (
    <>
      <JsonLd objects={[faqPageSchema(HOME_FAQ)]} />

      {/* ── Hero ── */}
      <section className="border-b">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 pt-12 pb-10 sm:px-6 lg:grid-cols-[1.05fr_auto] lg:items-start">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-600 dark:text-brand-400">
              {site.tagline}
            </p>
            <h1 className="mt-3 max-w-2xl text-balance text-4xl font-bold leading-tight tracking-tight sm:text-5xl">
              If you had actually invested ৳10,000 — how much <span className="text-brand-600 dark:text-brand-400">labh</span> would you have now?
            </h1>
            <p className="mt-4 max-w-xl text-lg leading-relaxed text-muted">
              Profithisab replays the published NAV
              history of Bangladesh&apos;s open-end mutual funds and shows, in black and white, what real money
              would have become. One fixed 3-year window. Dividends reinvested. Zero sales talk.
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <span className="chip"><strong className="text-fg">{ALL_FUNDS.length}</strong> open-end funds tracked</span>
              <span className="chip"><strong className="text-fg">{VERIFIED_COUNT}</strong> AMC-Verified</span>
              <span className="chip"><strong className="text-fg">{AMCs.length}</strong> asset managers</span>
              <span className="chip"><strong className="text-fg">{site.taglineBn}</strong></span>
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/funds" className="btn-cta">Browse the 38 funds →</Link>
              <Link href="/compare" className="btn-quiet">Compare two funds</Link>
            </div>
            <p className="mt-4 text-xs text-faint">
              Free · No login · NAV history through {site.asOfLong} · Not investment advice
            </p>
          </div>

          <aside className="grid w-full max-w-md gap-3 justify-self-center sm:grid-cols-2 lg:max-w-sm">
            <MiniStat label="Funds replayed" value={`${ALL_FUNDS.length}`} sub="of 100+ open-end in BD" />
            <MiniStat label="Managed assets" value={`${Math.round(TOTAL_AUM_CR)} cr`} sub="৳ in the tracked book" />
            <MiniStat label="One window" value="3 years" sub="same clock for every fund" />
            <MiniStat label="Fee honesty" value="per prospectus" sub="management + recurring" />
          </aside>
        </div>
      </section>

      {/* ── Calculator ── */}
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6" aria-labelledby="calc-head">
        <div className="mb-6 max-w-2xl">
          <h2 id="calc-head" className="text-2xl font-bold tracking-tight sm:text-3xl">
            The honest replay calculator — a Bangladesh SIP calculator that uses real fund history
          </h2>
          <p className="mt-2 text-muted">
            Pick an amount, decide monthly or one-time, tick the Halal box if you want only Shariah-compliant
            funds, and see the past, cold and correct.
          </p>
        </div>
        <div className="card card-pad !p-5 sm:!p-6">
          <Calculator />
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="border-y">
        <div className="mx-auto grid max-w-6xl gap-6 px-4 py-10 sm:px-6 md:grid-cols-3">
          {[
            ["A single, fixed window", "Every fund's headline uses the same 3-year clock ending in the latest NAV month. Fancy cherry-picking start dates is exactly what we refuse to do."],
            ["Dividends reinvested", "Whenever a fund pays a dividend, we buy units with it at that day's NAV. The result: total return, the measure a real investor actually lives with."],
            ["Published numbers only", "NAV history comes from disclosures AMCs report through official channels; fees are quoted per prospectus. When a fund is cross-check-verified, it wears the badge."],
          ].map(([h, p]) => (
            <div key={h}>
              <h3 className="font-semibold">{h}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">{p}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Featured funds ── */}
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6" aria-labelledby="feat-head">
        <div className="mb-5 flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h2 id="feat-head" className="text-2xl font-bold tracking-tight">Last 3 years, led by the honest kids</h2>
            <p className="mt-1 max-w-xl text-sm text-muted">
              Sorted by the one number we always compute the same way: one-time 3-year return, dividends
              reinvested. The laggards are equally visible on <Link className="underline decoration-dotted hover:text-fg" href="/funds">the full list</Link>.
            </p>
          </div>
          <Link href="/guides/best-mutual-funds-bangladesh" className="text-sm font-medium text-brand-600 hover:underline dark:text-brand-400">
            Full 3-year leaderboard →
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {top.map((f) => (
            <FundCard key={f.slug} fund={f} />
          ))}
        </div>
      </section>

      {/* ── Benchmarks ── */}
      <section className="mx-auto max-w-6xl px-4 pb-10 sm:px-6" aria-labelledby="bench-head">
        <div className="card card-pad">
          <div className="grid gap-6 lg:grid-cols-[auto_1fr] lg:items-start">
            <div className="max-w-sm">
              <h2 id="bench-head" className="text-lg font-semibold">The rivals every fund has to beat</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                In Bangladesh the benchmark isn&apos;t only other funds — it&apos;s the government
                certificate in your neighbour&apos;s drawer. Annualized rates over the same rolling 3-year
                window as the funds above.
              </p>
              <ul className="mt-3 space-y-1 text-xs text-faint">
                {BENCHES.map((b) => (
                  <li key={b.slug}>· {b.note}</li>
                ))}
              </ul>
            </div>
            <BenchBars
              items={[
                { label: "Sanchayapatra", value: BENCHES[0].ann.g3, color: "#6366f1" },
                { label: "Bank FDR", value: BENCHES[1].ann.g3, color: "#0ea5e9" },
                { label: "Inflation", value: BENCHES[2].ann.g3, color: "#f59e0b" },
                { label: "Gold (৳)", value: BENCHES[3].ann.g3, color: "#eab308" },
                { label: "DSEX", value: BENCHES[4].ann.g3, color: "#8b5cf6" },
              ]}
            />
          </div>
        </div>
      </section>

      {/* ── Learn ── */}
      <section className="mx-auto max-w-6xl px-4 pb-14 sm:px-6" aria-labelledby="learn-head">
        <h2 id="learn-head" className="text-2xl font-bold tracking-tight">Learn the maths, dodge the marketing</h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { href: "/guides/how-to-invest-in-mutual-funds-in-bangladesh", title: "How to invest in mutual funds in Bangladesh", sub: "BO account, KYC, SIP setup, redemption — step by step." },
            { href: "/guides/shariah-compliant-mutual-funds-bangladesh", title: "Shariah-compliant mutual funds", sub: "What “Halal-certified” actually means on paper." },
            { href: "/guides/best-mutual-funds-bangladesh", title: "Best mutual funds, ranked by data", sub: "The current 3-year table, rebuilt from NAV history." },
            { href: "/guides/mutual-fund-tax-bangladesh", title: "Tax on mutual fund returns", sub: "Dividends, capital gains, and Sanchayapatra's 10% cut." },
          ].map((c) => (
            <Link key={c.href} href={c.href} className="card card-pad transition hover:border-brand-500">
              <h3 className="font-semibold leading-snug">{c.title}</h3>
              <p className="mt-1.5 text-sm text-muted">{c.sub}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="mx-auto max-w-3xl px-4 pb-16 sm:px-6" aria-labelledby="faq-head">
        <h2 id="faq-head" className="text-2xl font-bold tracking-tight">Direct questions, direct answers</h2>
        <div className="mt-5 space-y-2">
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
        <div className="card card-pad flex flex-col items-start justify-between gap-4 bg-brand-600 text-white sm:!p-8 sm:flex-row sm:items-center dark:bg-brand-800">
          <div>
            <h2 className="text-xl font-bold">Numbers first. Then, if you want, buy units.</h2>
            <p className="mt-1 text-sm text-brand-50">
              Purchases happen with the fund&apos;s asset manager, an authorised agent or an investing app.
              Partners may pay us a referral fee — but they never pay for rankings, badges or a single digit.
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
