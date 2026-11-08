import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ALL_FUNDS, getFund, fundSeed, metricsFor, lumpPath, benchTrail } from "@/lib/returns";
import { BENCHES } from "@/lib/benchmarks";
import { MultiLineChart } from "@/components/charts/line-chart";
import { BenchBars } from "@/components/charts/bench-bars";
import { TypeBadge, VerifiedBadge, Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/ui/copy-button";
import { taka, takaExact, cr, pct, longDate } from "@/lib/format";
import { site } from "@/lib/site";
import { pageMeta, investmentFundSchema, breadcrumbSchema, faqPageSchema } from "@/lib/seo";
import { JsonLd } from "@/components/seo/jsonld";

export function generateStaticParams() {
  return ALL_FUNDS.map((f) => ({ slug: f.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const fund = getFund(slug);
  if (!fund) {
    return pageMeta({ title: "Fund not found | Profithisab", description: "That fund is not on Profithisab.", path: `/funds/${slug}` });
  }
  const m = metricsFor(slug);
  const became = taka(100000 * Math.pow(1 + (m.g3 ?? m.gMax ?? 0), (m.g3 !== null ? 3 : (fund.series.length - 1) / 12)));
  const desc =
    `৳1,00,000 became ${became} in ${fund.name} (${fund.acronym}, managed by ${fund.amc}) — ${pct(m.g3 ?? m.gMax ?? 0)} ` +
    `per year, dividends reinvested, over a fixed 3-year window ending ${site.asOfLong}. NAV history, ` +
    `৳5,000/month SIP replay, worst fall ${pct(m.worstFall, { signed: false })} and the ${fund.fee.toFixed(2)}% fee.`;

  return pageMeta({
    title: `${fund.name} (${fund.acronym}) — Returns, NAV & Fee`,
    description: desc,
    path: `/funds/${fund.slug}`,
    keywords: [
      `${fund.name} returns`,
      `${fund.acronym} NAV`,
      `${fund.name} dividend history`,
      `${fund.amc} mutual fund Bangladesh`,
      fund.shariah ? `${fund.name} shariah compliant fund` : `${fund.type} mutual fund Bangladesh`,
    ],
  });
}

export default async function FundPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const fund = getFund(slug);
  if (!fund) notFound();
  const m = metricsFor(slug);
  const has3y = fund.series.length > 37;

  // Hero replay: exactly the window the headline names (3 years when available).
  const heroMonths = has3y ? 36 : fund.series.length - 1;
  const lump = lumpPath(slug, 100000, heroMonths);

  // Chart replays the FULL tracked window vs sanchayapatra & DSEX.
  const lumpFull = lumpPath(slug, 100000, fund.series.length - 1);
  const lLabels = lumpFull.map((p) => p.m);
  const lVals = lumpFull.map((p) => p.v);
  const sanchTrail = benchTrail(BENCHES[0].slug, fund).map((p) => p.v * 100000);
  const dsexTrail = benchTrail(BENCHES[4].slug, fund).map((p) => p.v * 100000);
  const g100kLump = lump.length ? lump[lump.length - 1].v / 100000 - 1 : 0;

  const sipFinal3 = m.sip.final3;
  const sipInvested3 = 180000;

  const dividends = fund.series.filter((p) => p.div > 0).slice(-6).reverse();
  const g3Target = m.g3 ?? m.gMax ?? 0;
  const related = ALL_FUNDS.filter((x) => x.slug !== fund.slug && x.type === fund.type)
    .map((x) => ({ x, d: Math.abs((metricsFor(x.slug).g3 ?? metricsFor(x.slug).gMax ?? 0) - g3Target) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, 3)
    .map((e) => e.x);

  const benchmarksBars = [
    { label: fund.acronym, value: g3Target * 100, highlight: true },
    { label: "Sanchayapatra", value: BENCHES[0].ann.g3, color: "#6366f1" },
    { label: "Bank FDR", value: BENCHES[1].ann.g3, color: "#0ea5e9" },
    { label: "Inflation", value: BENCHES[2].ann.g3, color: "#f59e0b" },
    { label: "Gold (৳)", value: BENCHES[3].ann.g3, color: "#eab308" },
  ];

  const faqs = fundFaqs(fund, m);
  const became = lump.length ? lump[lump.length - 1].v : 100000;

  return (
    <div className="mx-auto max-w-6xl px-4 pt-8 sm:px-6">
      <JsonLd
        objects={[
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Funds", path: "/funds" },
            { name: fund.name, path: `/funds/${fund.slug}` },
          ]),
          investmentFundSchema({
            name: fund.name,
            slug: fund.slug,
            manager: fund.amc,
            category: `${fund.type}${fund.shariah ? ", Shariah-compliant" : ""}`,
            currency: "BDT",
            minInvestment: fund.minTaka,
            description:
              `Bangladeshi ${fund.type} open-end mutual fund managed by ${fund.amc}. Tracked total return ` +
              `${pct(g3Target)} per year over a fixed 3-year window, dividends reinvested.`,
            rateOfReturn: g3Target * 100,
            isShariah: fund.shariah,
          }),
          faqPageSchema(faqs),
        ]}
      />

      <nav aria-label="Breadcrumb" className="mb-3 text-xs text-muted">
        <Link href="/" className="hover:text-fg">Home</Link> →{" "}
        <Link href="/funds" className="hover:text-fg">Funds</Link> →{" "}
        <span className="text-fg">{fund.name}</span>
      </nav>

      {/* Hero */}
      <header className="card !p-5 sm:!p-8">
        <div className="flex flex-wrap items-center gap-2">
          <TypeBadge type={fund.type} shariah={fund.shariah} />
          {fund.verified ? <VerifiedBadge /> : <Badge tone="slate">Sourced: published NAV feeds</Badge>}
          <Badge tone="neutral">{fund.acronym}</Badge>
        </div>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{fund.name}</h1>
        <p className="mt-1 text-sm text-muted">
          {fund.amc} Asset Management · Inception {longDate(fund.inception)} · Latest NAV{" "}
          <strong className="tnum text-fg">৳{m.latestNav.toFixed(2)}</strong> ({m.asOf})
        </p>

        <p className="mt-6 text-xl font-semibold leading-relaxed sm:text-2xl">
          ৳1,00,000 invested {has3y ? "3 years ago" : `at our window's start (${longDate(fund.series[0].m)})`} became{" "}
          <span className="whitespace-nowrap text-brand-600 dark:text-brand-400">{takaExact(became)}</span>{" "}
          <span className="text-sm font-normal text-muted">({pct(g100kLump)} total · dividends reinvested)</span>
        </p>

        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <Metric label="3 yr / yr" value={pct(m.g3)} accent={m.g3 !== null} />
          <Metric label="1 yr / yr" value={pct(m.g1)} />
          <Metric label="SIP ৳5k/mo·3 yr" value={pct(m.sip.irr3)} sub="per year" />
          <Metric label="Worst fall" value={pct(m.worstFall, { signed: false })} tone="bad" />
          <Metric label="Assets" value={cr(fund.aumCr)} />
          <Metric label="Fee / year" value={`${fund.fee.toFixed(2)}%`} />
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          <Link href={`/compare?funds=${fund.slug},ekush-first-unit-fund&amount=100000`} className="btn-cta text-sm">Compare this fund →</Link>
          <CopyButton text={`${site.url}/funds/${fund.slug}`} label="Copy link" />
          <Link href="#method" className="btn-quiet text-sm">How every figure is built</Link>
        </div>
      </header>

      {/* Charts */}
      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="card card-pad">
          <MultiLineChart
            title={`What ৳1,00,000 did across the full tracked window — total return`}
            labels={lLabels}
            series={[
              { name: `${fund.acronym}`, values: lVals, color: "#059669", area: true },
              { name: "Sanchayapatra (3-yr, par)", values: sanchTrail, color: "#6366f1", dashed: true },
              { name: "DSEX price index", values: dsexTrail, color: "#8b5cf6", dashed: true },
            ]}
            formatTick={(v) => taka(v)}
            note={`Ends ${m.asOf}`}
          />
        </div>
        <div className="card card-pad">
          <MultiLineChart
            title="NAV per unit — the published price alone"
            labels={fund.series.map((p) => p.m)}
            series={[{ name: "NAV (৳/unit)", values: fund.series.map((p) => p.nav), color: "#0f766e", area: true }]}
            formatTick={(v) => `৳${v.toFixed(0)}`}
            note={`Latest ৳${m.latestNav.toFixed(2)} · monthly NAVs`}
          />
        </div>
      </section>

      {/* Details */}
      <section className="mt-8 grid gap-6 lg:grid-cols-[1.15fr_1fr]">
        <div className="card card-pad">
          <h2 className="text-lg font-semibold">The numbers that matter</h2>
          <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
            <KV k="1-year" v={pct(m.g1)} />
            <KV k="3-year (per year)" v={pct(m.g3)} accent />
            <KV k="5-year (per year)" v={m.g5 === null ? "—" : pct(m.g5)} />
            <KV k={`Since ${longDate(fund.series[0].m)}`} v={pct(m.gMax)} sub="our window" />
            <KV k="SIP ৳5k×3 yr → value" v={sipFinal3 === null ? "—" : takaExact(sipFinal3)} />
            <KV k="SIP per year" v={pct(m.sip.irr3)} accent />
            <KV k="Worst NAV fall" v={pct(m.worstFall, { signed: false })} tone="bad" />
            <KV k="Volatility / yr" v={`${m.vol.toFixed(1)}%`} />
            <KV k="Beta vs DSEX" v={m.beta.toFixed(2)} />
            <KV k="Positive months (3 yr)" v={m.positiveMonths3y === null ? "—" : `${Math.round((m.positiveMonths3y as number) * 100)}%`} />
            <KV k="Dividends (3 yr)" v={taka(m.divPaid3y)} sub="per unit" />
            <KV k="Latest NAV" v={`৳${m.latestNav.toFixed(2)}`} />
          </div>

          <div className="mt-6 border-t border-line pt-5">
            <h3 className="text-sm font-semibold">Against the usual rivals</h3>
            <p className="mb-3 text-xs text-faint">Annualized % — the same 3-year clock as the headline.</p>
            <BenchBars items={benchmarksBars} />
          </div>
        </div>

        <div className="space-y-6">
          <div className="card card-pad">
            <h2 className="text-lg font-semibold">Fees, minimums, exits</h2>
            <dl className="mt-3 grid gap-y-2.5 text-sm">
              <Row k="Fee (management + recurring)" v={`${fund.fee.toFixed(2)}% a year`} />
              <Row k="Exit loads / lock-ups" v="As per the prospectus — typically nil after the first months. We only publish prospectus terms, never guesses." />
              <Row k="Minimum first application" v={takaExact(fund.minTaka)} />
              <Row k="How to buy" v="With the AMC, an authorised agent or an investing app — measured steps in the invest guide." />
            </dl>
          </div>

          <div className="card card-pad">
            <h2 className="text-lg font-semibold">Dividend record</h2>
            {dividends.length ? (
              <table className="mt-3 w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-faint">
                    <th className="pb-2 font-medium">Month</th>
                    <th className="pb-2 text-right font-medium">৳ per unit</th>
                  </tr>
                </thead>
                <tbody className="tnum">
                  {dividends.map((d) => (
                    <tr key={d.m} className="border-t border-line">
                      <td className="py-1.5">{longDate(d.m)}</td>
                      <td className="py-1.5 text-right">৳{d.div.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="mt-2 text-sm text-muted">
                No cash dividends in the tracked window — this fund&apos;s story lives and dies by its NAV
                (the usual growth-style arrangement; income funds are the mirror image).
              </p>
            )}
          </div>

          <div className="card card-pad">
            <h2 className="text-lg font-semibold">Holdings &amp; allocation</h2>
            <p className="mt-2 text-sm text-muted">
              Portfolios go up only when an AMC discloses them in a citable format — never scraped, never guessed.
              For {fund.name} this build has no verified portfolio snapshot yet; it arrives with the{" "}
              <span className="font-medium">AMC-Verified</span> badge, and not before.
            </p>
          </div>
        </div>
      </section>

      {/* SIP replay */}
      <section className="card card-pad mt-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">The ৳5,000-a-month question, answered</p>
          <p className="mt-1 max-w-xl text-sm text-muted">
            Buying {takaExact(5000)} worth of {fund.name} at each month-end across the last 3 years (dividends
            reinvested) would stand at{" "}
            <strong className="tnum text-fg">{sipFinal3 === null ? "—" : takaExact(sipFinal3)}</strong>, from{" "}
            {takaExact(sipInvested3)} in instalments.
          </p>
        </div>
        <Link href="/" className="btn-quiet text-xs">Run your own amount →</Link>
      </section>

      {/* Methodology */}
      <section className="mt-8" id="method">
        <h2 className="text-xl font-bold tracking-tight">How every figure on this page is built</h2>
        <div className="mt-4 space-y-2">
          <details className="card px-4 py-3" open>
            <summary className="cursor-pointer list-none font-medium">Total return (the headline)</summary>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              One unit, bought at the window&apos;s first published NAV. Each month the holding moves by that
              month&apos;s published NAV; declared dividends buy more units at that month&apos;s NAV. End value ÷
              start value, annualized. That chain of NAVs and dividends is the only machinery.
            </p>
          </details>
          <details className="card px-4 py-3">
            <summary className="cursor-pointer list-none font-medium">The 3-year window</summary>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Fixed: the trailing 36 published months ({site.asOfLong} is the last). Funds with under 3 years of NAV
              history show their since-inception figure, marked as such — also on cards and in compare.
            </p>
          </details>
          <details className="card px-4 py-3">
            <summary className="cursor-pointer list-none font-medium">Worst fall, volatility, beta</summary>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Worst fall: the largest peak-to-trough drop of the NAV line (dividends not smoothing it) — closest to
              what a statement experiences. Volatility: annualized st. dev. of monthly NAV moves. Beta: co-movement
              against the DSEX price index over the same 36 months.
            </p>
          </details>
          <details className="card px-4 py-3">
            <summary className="cursor-pointer list-none font-medium">SIP arithmetic</summary>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              ৳5,000 bought at each of 36 consecutive month-end NAVs, dividends reinvested, value marked at the
              latest NAV. The &quot;per year&quot; figure is the money-weighted IRR of those flows — a SIP and a
              lump sum can land on very different annual numbers, and both are shown for the same fund.
            </p>
          </details>
          <details className="card px-4 py-3">
            <summary className="cursor-pointer list-none font-medium">Data status</summary>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              This build ships an anchored demo dataset: month-by-month paths replay to match each fund&apos;s
              published anchors (3-yr, since-launch, worst fall).{" "}
              {fund.verified
                ? `${fund.amc} has confirmed the ${fund.name} series — hence AMC-Verified.`
                : `The ${fund.amc} series isn't AMC-verified yet.`}{" "}
              Full details: <Link className="underline decoration-dotted hover:text-fg" href="/methodology#data-status">data status</Link>.
            </p>
          </details>
        </div>
      </section>

      {/* FAQ */}
      <section className="mt-8">
        <h2 className="text-xl font-bold tracking-tight">Straight answers</h2>
        <div className="mt-4 space-y-2">
          {faqs.map((f) => (
            <details key={f.q} className="card px-4 py-3">
              <summary className="cursor-pointer list-none font-medium">{f.q}</summary>
              <p className="mt-2 text-sm leading-relaxed text-muted">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Related */}
      <section className="mt-10">
        <h2 className="text-xl font-bold tracking-tight">Close cousins, same window</h2>
        <p className="mt-1 text-sm text-muted">
          Same {fund.type} category, nearest 3-year total returns. For differences side by side, the{" "}
          <Link className="underline decoration-dotted hover:text-fg" href="/compare">compare tool</Link> goes deeper.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {related.map((rf) => (
            <Link key={rf.slug} href={`/funds/${rf.slug}`} className="card card-pad transition hover:border-brand-500">
              <div className="flex flex-wrap items-center gap-1.5">
                <TypeBadge type={rf.type} shariah={rf.shariah} />
                {rf.verified ? <VerifiedBadge /> : null}
              </div>
              <p className="mt-2 font-semibold leading-snug">{rf.name}</p>
              <p className="mt-1 text-xs text-muted">{rf.amc} · 3-yr {pct(g3Of(rf.slug))}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-10 flex flex-wrap gap-3 pb-14">
        <Link href="/compare" className="btn-quiet text-sm">Compare funds →</Link>
        <Link href="/guides/how-to-invest-in-mutual-funds-in-bangladesh" className="btn-quiet text-sm">How to buy units →</Link>
        <Link href="/methodology" className="btn-quiet text-sm">Full methodology →</Link>
      </section>
    </div>
  );
}

/* ── bits ── */

function g3Of(slug: string): number | null {
  const m = metricsFor(slug);
  return m.g3 ?? m.gMax;
}

function Metric({ label, value, accent, tone, sub }: { label: string; value: string; accent?: boolean; tone?: "bad"; sub?: string }) {
  return (
    <div className="rounded-xl border border-line bg-raised px-3 py-2.5">
      <p className="text-[11px] font-medium text-muted">{label}</p>
      <p className={`tnum text-lg font-bold ${accent ? "text-brand-600 dark:text-brand-400" : tone === "bad" ? "text-red-600 dark:text-red-400" : ""}`}>
        {value}
        {sub ? <span className="ml-1 text-[10px] font-normal text-faint">{sub}</span> : null}
      </p>
    </div>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex flex-wrap justify-between gap-2 border-b border-line pb-2.5">
      <dt className="text-muted">{k}</dt>
      <dd className="max-w-[60%] text-right font-medium">{v}</dd>
    </div>
  );
}

function KV({ k, v, accent, tone, sub }: { k: string; v: string; accent?: boolean; tone?: "bad"; sub?: string }) {
  return (
    <div>
      <dt className="text-[11px] font-medium text-muted">{k}</dt>
      <dd className={`tnum font-bold ${accent ? "text-brand-600 dark:text-brand-400" : tone === "bad" ? "text-red-600 dark:text-red-400" : ""}`}>
        {v}
        {sub ? <span className="ml-1 text-[10px] font-normal text-faint">({sub})</span> : null}
      </dd>
    </div>
  );
}

function fundFaqs(fund: NonNullable<ReturnType<typeof getFund>>, m: ReturnType<typeof metricsFor>): Array<{ q: string; a: string }> {
  const gT = m.g3 ?? m.gMax ?? 0;
  const has3y = fund.series.length > 37;
  return [
    {
      q: `How did ৳1,00,000 do in ${fund.name}?`,
      a: `৳${new Intl.NumberFormat("en-IN").format(Math.round(100000 * Math.pow(1 + gT, has3y ? 3 : (fund.series.length - 1) / 12)))} by the latest NAV window ${has3y ? "over three years" : `over ${Math.floor((fund.series.length - 1) / 12)} years`}, dividends reinvested; ${pct(gT)} annualized.`,
    },
    {
      q: `What does a ৳5,000 monthly SIP in ${fund.acronym} return per year?`,
      a: `Over the tracked 3 years: ${taka(m.sip.final3 ?? 0)} from ৳1,80,000 of instalments (${m.sip.irr3 === null ? "no IRR estimate possible" : pct(m.sip.irr3) + " money-weighted per year"}). Your own dates shift the answer — this is history's, not a forecast.`,
    },
    {
      q: `What fees does ${fund.name} charge?`,
      a: `${fund.fee.toFixed(2)}% of assets per year per the prospectus — ${fund.fee > 1.5 ? "on the higher side among Bangladesh open-end funds" : "reasonable for its category"}. Fees are the most predictable part of any return statement, usually in the wrong direction.`,
    },
    {
      q: `Is ${fund.acronym} good for 2026?`,
      a: `Profithisab doesn't do prophecies. The record: ${has3y ? `${pct(g3Target(fund.slug))} per year over a fixed 3-year window` : `${pct(gT)} per year since our window opens`}, worst NAV fall ${pct(m.worstFall, { signed: false })}, dividends ${taka(m.divPaid3y)}/unit over 3 years. Stack it honestly against Sanchayapatra, FDR and inflation on this page.`,
    },
  ];
}

function g3Target(slug: string): number {
  const m = metricsFor(slug);
  return m.g3 ?? m.gMax ?? 0;
}
