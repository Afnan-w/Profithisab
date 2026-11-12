import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ALL_FUNDS, BENCHES, getFund, lumpPath, metricsFor, benchTrail, benchTrailStart } from "@/lib/returns";
import { MultiLineChart } from "@/components/charts/line-chart";
import { BenchBars } from "@/components/charts/bench-bars";
import { TypeBadge, QualityBadge, Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/ui/copy-button";
import { taka, takaExact, cr, pct, longDate, fullDate, NOT_AVAILABLE, NOT_ENOUGH_HISTORY } from "@/lib/format";
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
  const headline = m.g3 ?? m.gMax;
  const fee = fund.fee === null ? "fee not available" : `${fund.fee.toFixed(2)}% fee`;
  const desc =
    `${fund.name} (${fund.acronym}, managed by ${fund.amc}) — ${headline === null ? "not enough history for a return figure" : `${pct(headline)} per year`}, ` +
    `dividends reinvested. NAV history, ৳5,000/month SIP replay, worst fall, ${fee} and latest NAV ${fullDate(fund.latestNavDate)}.`;

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
  const has3y = m.g3 !== null;
  const headline = m.g3 ?? m.gMax;
  const headlineLabel = has3y ? "3-year, per year" : headline === null ? NOT_ENOUGH_HISTORY : "since launch, per year";

  const lumpMonths = has3y ? 36 : Math.max(0, fund.series.length - 1);
  const lump = lumpPath(slug, 100000, lumpMonths);
  const lumpFull = lumpPath(slug, 100000, Math.max(0, fund.series.length - 1));
  const labels = lumpFull.map((p) => p.date.slice(0, 7));
  const values = lumpFull.map((p) => p.value);
  const sanch = BENCHES.find((b) => b.slug === "sanchayapatra");
  const sanchTrail = sanch ? benchTrail(sanch.slug, fund).map((v) => (v === null ? null : v * 100000)) : [];
  const indexTrails = BENCHES.filter((b) => b.series && b.series.length >= 2)
    .filter((b) => b.slug !== "dses" || fund.shariah)
    .map((b) => ({ bench: b, trail: benchTrail(b.slug, fund).map((v) => (v === null ? null : v * 100000)) }))
    .filter((e) => e.trail.some((v) => v !== null));
  const indexTrailStarts = indexTrails
    .map((e) => benchTrailStart(e.trail, fund))
    .filter((m): m is string => m !== null)
    .sort();
  const became = lump.length ? lump[lump.length - 1].value : null;
  const totalReturn = lump.length ? lump[lump.length - 1].value / 100000 - 1 : null;

  const sipFinal3 = m.sip.final3;
  const sipInvested3 = m.sip.invested3 ?? 180000;

  const dividends = fund.series.filter((p) => p.div > 0).slice(-6).reverse();
  const related = ALL_FUNDS.filter((x) => x.slug !== fund.slug && x.type === fund.type)
    .map((x) => ({ x, d: Math.abs((metricsFor(x.slug).g3 ?? metricsFor(x.slug).gMax ?? 0) - (headline ?? 0)) }))
    .sort((a, b) => a.d - b.d)
    .slice(0, 3)
    .map((e) => e.x);

  const benchmarkBars = [
    ...(headline !== null
      ? [{ label: fund.acronym, value: headline * 100, color: "#059669", highlight: true }]
      : []),
    ...BENCHES.filter((b) => b.status !== "unavailable" && b.annualRate !== null).map((b) => ({
      label: b.short,
      value: b.annualRate as number,
      color: b.color,
    })),
  ];

  const faqs = fundFaqs(fund, m);
  const feeText = fund.fee === null ? NOT_AVAILABLE : `${fund.fee.toFixed(2)}%`;

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
            minInvestment: fund.minTaka ?? 0,
            description:
              `Bangladeshi ${fund.type} open-end mutual fund managed by ${fund.amc}. ` +
              (headline === null
                ? "Not enough published NAV history for an annualised return figure."
                : `Tracked total return ${pct(headline)} per year, dividends reinvested.`),
            rateOfReturn: headline === null ? undefined : headline * 100,
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
      <header className="card card-pad !p-5 sm:!p-8 elev reveal">
        <div className="flex flex-wrap items-center gap-2">
          <TypeBadge type={fund.type} shariah={fund.shariah} />
          <QualityBadge completeness={fund.completeness} stale={fund.isStale} />
          <Badge tone="neutral">{fund.acronym}</Badge>
        </div>
        <h1 className="mt-3 text-3xl font-bold tracking-tight sm:text-4xl">{fund.name}</h1>
        <p className="mt-1 text-sm text-muted">
          {fund.amc} · Inception {fund.inception ? longDate(fund.inception) : NOT_AVAILABLE} · Latest NAV{" "}
          <strong className="tnum text-fg">{m.latestNav ? `৳${m.latestNav.toFixed(2)}` : NOT_AVAILABLE}</strong>{" "}
          ({fullDate(fund.latestNavDate)})
        </p>

        {became !== null && totalReturn !== null ? (
          <p className="mt-7 text-xl font-semibold leading-relaxed sm:text-2xl">
            ৳1,00,000 invested {has3y ? "3 years ago" : `at the start of this window (${longDate(labels[0])})`} became{" "}
            <span className="whitespace-nowrap text-brand-600 dark:text-brand-400">{takaExact(became)}</span>{" "}
            <span className="text-sm font-normal text-muted">({pct(totalReturn)} total · dividends reinvested)</span>
          </p>
        ) : (
          <p className="mt-7 rounded-xl border border-line bg-raised p-4 text-sm text-muted">
            {NOT_ENOUGH_HISTORY} for a ৳1,00,000 replay. This fund has {fund.nav.length} published NAV observation
            {fund.nav.length === 1 ? "" : "s"} in the data file; at least two, at least 90 days apart, are required.
          </p>
        )}

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
          <Metric label={has3y ? "3 yr / yr" : "Per year"} value={pct(headline)} accent={headline !== null} />
          <Metric label="1 yr / yr" value={pct(m.g1)} />
          <Metric label="SIP ৳5k/mo · 3 yr" value={pct(m.sip.irr3)} sub="per year" />
          <Metric label="Worst fall" value={pct(m.worstFall, { signed: false })} tone="bad" />
          <Metric label="Reported size" value={fund.fundSize === null ? NOT_AVAILABLE : cr(fund.fundSize)} />
          <Metric label="Fee / year" value={feeText} />
        </div>

        <div className="mt-7 flex flex-wrap gap-2">
          <Link href={`/compare?funds=${fund.slug}`} className="btn-cta text-sm">Compare this fund →</Link>
          <CopyButton text={`${site.url}/funds/${fund.slug}`} label="Copy link" />
          <Link href="#method" className="btn-ghost text-sm">How every figure is built</Link>
        </div>
      </header>

      {/* Charts */}
      <section className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="card card-pad elev reveal">
          {values.length >= 2 ? (
            <MultiLineChart
              title="What ৳1,00,000 did across the tracked window — total return"
              labels={labels}
              series={[
                { name: fund.acronym, values, color: "#059669", area: true },
                ...(sanchTrail.length
                  ? [{ name: `${sanch!.short} at ${sanch!.annualRate?.toFixed(2)}%/yr (approx.)`, values: sanchTrail, color: sanch!.color, dashed: true }]
                  : []),
                ...indexTrails.map(({ bench, trail }) => ({
                  name: `${bench.short} — actual index levels`,
                  values: trail,
                  color: bench.color,
                })),
              ]}
              formatTick={(v) => taka(v)}
              note={`Ends ${fullDate(fund.latestNavDate)}${indexTrailStarts.length && indexTrailStarts[0] > labels[0] ? ` · index line starts ${indexTrailStarts[0]}` : ""}`}
            />
          ) : (
            <p className="text-sm text-muted">Not enough NAV history to draw a total-return chart.</p>
          )}
        </div>
        <div className="card card-pad elev reveal">
          {fund.series.length >= 2 ? (
            <MultiLineChart
              title="NAV per unit — the published price alone"
              labels={fund.series.map((p) => p.m)}
              series={[{ name: "NAV (৳/unit)", values: fund.series.map((p) => p.nav), color: "#0f766e", area: true }]}
              formatTick={(v) => `৳${v.toFixed(2)}`}
              note={`Latest ৳${m.latestNav.toFixed(2)} · month-end NAVs`}
            />
          ) : (
            <p className="text-sm text-muted">No NAV series is available for this fund yet.</p>
          )}
        </div>
      </section>

      {/* Details */}
      <section className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_1fr]">
        <div className="card card-pad elev reveal">
          <h2 className="text-lg font-semibold">The numbers that matter</h2>
          <div className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 text-sm sm:grid-cols-3">
            <KV k="1-year" v={pct(m.g1)} />
            <KV k="3-year (per year)" v={pct(m.g3)} accent />
            <KV k="5-year (per year)" v={pct(m.g5)} />
            <KV k="Since launch (per year)" v={pct(m.gMax)} sub="where history allows" />
            <KV k="SIP ৳5k×3 yr → value" v={sipFinal3 === null ? NOT_AVAILABLE : takaExact(sipFinal3)} />
            <KV k="SIP per year" v={pct(m.sip.irr3)} accent />
            <KV k="Worst NAV fall" v={pct(m.worstFall, { signed: false })} tone="bad" />
            <KV k="Volatility / yr" v={m.vol === null ? NOT_AVAILABLE : `${(m.vol * 100).toFixed(1)}%`} />
            <KV k="Positive months (3 yr)" v={m.positiveMonths3y === null ? NOT_AVAILABLE : `${Math.round(m.positiveMonths3y * 100)}%`} />
            <KV k="Dividends (3 yr)" v={fund.dividends.length ? taka(m.divPaid3y) : NOT_AVAILABLE} sub="per unit" />
            <KV k="Latest NAV" v={m.latestNav ? `৳${m.latestNav.toFixed(2)}` : NOT_AVAILABLE} />
            <KV k="NAV observations" v={String(fund.nav.length)} />
          </div>

          <div className="mt-6 border-t border-line pt-5">
            <h3 className="text-sm font-semibold">Against the usual rivals</h3>
            <p className="mb-3 text-xs text-faint">
              Annualised % — the same window as the headline. Benchmark rates are working approximations, not quoted product rates.
            </p>
            {benchmarkBars.length ? <BenchBars items={benchmarkBars} /> : <p className="text-sm text-muted">No benchmark rate is loaded.</p>}
          </div>
        </div>

        <div className="space-y-6">
          <div className="card card-pad elev reveal">
            <h2 className="text-lg font-semibold">Fees, minimums, exits</h2>
            <dl className="mt-3 grid gap-y-2.5 text-sm">
              <Row k="Fee (management + recurring)" v={fund.fee === null ? NOT_AVAILABLE : `${fund.fee.toFixed(2)}% a year`} />
              <Row k="Exit loads / lock-ups" v="As per the prospectus. This build does not store exit-load terms, so it does not quote them." />
              <Row k="Minimum first application" v={fund.minTaka === null ? NOT_AVAILABLE : takaExact(fund.minTaka)} />
              <Row k="How to buy" v="With the AMC, an authorised agent or an investing app — measured steps in the invest guide." />
            </dl>
          </div>

          <div className="card card-pad elev reveal">
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
                No cash dividends are recorded in the committed data for this fund. That is a data statement, not a
                promise that none were ever paid.
              </p>
            )}
          </div>

          <div className="card card-pad elev reveal">
            <h2 className="text-lg font-semibold">Dataset for this fund</h2>
            <dl className="mt-2 grid gap-y-2 text-xs">
              <Row k="Completeness" v={fund.completeness} />
              <Row k="Stale flag" v={fund.isStale ? "Yes — excluded from rankings" : "No"} />
              <Row k="Source" v={fund.source.name} />
              <Row k="Source URL" v={fund.source.url ? <a className="underline decoration-dotted" href={fund.source.url} target="_blank" rel="noopener noreferrer">Open source ↗</a> : NOT_AVAILABLE} />
              <Row k="Latest NAV date" v={fullDate(fund.latestNavDate)} />
            </dl>
            <p className="mt-3 text-xs leading-relaxed text-faint">
              Portfolio holdings are not stored in this build, so they are not shown.{" "}
              <Link href="/data-status" className="underline decoration-dotted hover:text-fg">See all fund data status →</Link>
            </p>
          </div>
        </div>
      </section>

      {/* SIP replay */}
      <section className="card card-pad mt-6 elev reveal flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold">The ৳5,000-a-month question, answered</p>
          <p className="mt-1 max-w-xl text-sm text-muted">
            {sipFinal3 === null ? (
              <>This fund does not have enough history for a 36-month SIP replay yet.</>
            ) : (
              <>
                Buying {takaExact(5000)} of {fund.name} at each month-end across the last 3 years (dividends
                reinvested) would stand at{" "}
                <strong className="tnum text-fg">{takaExact(sipFinal3)}</strong>, from {takaExact(sipInvested3)} in
                instalments.
              </>
            )}
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
              Units are bought at the window&apos;s first published NAV. The holding moves with each published NAV.
              A declared dividend buys more units at the first published NAV on or after the record date. End value
              ÷ start value, annualised geometrically. That chain of NAVs and dividends is the only machinery.
            </p>
          </details>
          <details className="card px-4 py-3">
            <summary className="cursor-pointer list-none font-medium">Windows and missing history</summary>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Headline 1/3/5-year figures use the trailing 12/36/60 months ending {fullDate(fund.latestNavDate)}.
              A window is shown only when the fund has NAV history covering it. Otherwise the page says
              &ldquo;Not enough history&rdquo; — it does not substitute a shorter, flattering period.
            </p>
          </details>
          <details className="card px-4 py-3">
            <summary className="cursor-pointer list-none font-medium">Worst fall, volatility, consistency</summary>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              Worst fall is the largest peak-to-trough drop of the NAV line itself (dividends do not cushion it).
              Volatility is annualised standard deviation of month-end NAV log-returns. Positive months is the share of
              trailing months where NAV rose or held. Beta versus DSEX uses the real month-end DSEX closes
              (exchange data published via Shanta AML) over up to 36 overlapping months; it is hidden when
              fewer than 12 clean overlapping months exist.
            </p>
          </details>
          <details className="card px-4 py-3">
            <summary className="cursor-pointer list-none font-medium">SIP arithmetic</summary>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              ৳5,000 buys units at each of 36 consecutive month-end NAVs, dividends reinvested, value marked at the
              latest NAV. The &ldquo;per year&rdquo; figure is the money-weighted IRR of those flows — a SIP and a
              lump sum can land on different annual numbers.
            </p>
          </details>
          <details className="card px-4 py-3">
            <summary className="cursor-pointer list-none font-medium">Data status</summary>
            <p className="mt-2 text-sm leading-relaxed text-muted">
              This fund&apos;s NAV file has {fund.nav.length} observation{fund.nav.length === 1 ? "" : "s"}, latest{" "}
              {fullDate(fund.latestNavDate)}. Completeness is <strong>{fund.completeness}</strong>.
              {fund.isStale ? " It is stale and therefore excluded from rankings." : " It is included in rankings where the window allows."}{" "}
              Full details: <Link className="underline decoration-dotted hover:text-fg" href="/data-status">data status</Link>.
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
        <h2 className="text-xl font-bold tracking-tight">Close cousins, same data rules</h2>
        <p className="mt-1 text-sm text-muted">
          Same {fund.type} category, nearest headline returns. For differences side by side, the{" "}
          <Link className="underline decoration-dotted hover:text-fg" href="/compare">compare tool</Link> goes deeper.
        </p>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          {related.map((rf) => (
            <Link key={rf.slug} href={`/funds/${rf.slug}`} className="card card-pad transition hover:border-brand-500 group">
              <div className="flex flex-wrap items-center gap-1.5">
                <TypeBadge type={rf.type} shariah={rf.shariah} />
                <QualityBadge completeness={rf.completeness} stale={rf.isStale} />
              </div>
              <p className="mt-2 font-semibold leading-snug group-hover:text-brand-700 dark:group-hover:text-brand-400 transition-colors">{rf.name}</p>
              <p className="mt-1 text-xs text-muted">{rf.amc} · {pct(g3Of(rf.slug))}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-12 flex flex-wrap gap-3 pb-20">
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

function Row({ k, v }: { k: string; v: React.ReactNode }) {
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
  const headline = m.g3 ?? m.gMax;
  const has3y = m.g3 !== null;
  return [
    {
      q: `How did ৳1,00,000 do in ${fund.name}?`,
      a:
        headline === null
          ? `There is not enough published NAV history in our data file to answer that honestly yet. The fund has ${fund.nav.length} NAV observation${fund.nav.length === 1 ? "" : "s"}, latest ${fullDate(fund.latestNavDate)}.`
          : `A ৳1,00,000 one-time investment over ${has3y ? "the last three years" : "the tracked since-launch window"} is worth ${takaExact(100000 * Math.pow(1 + headline, has3y ? 3 : Math.max(1, (fund.series.length - 1) / 12)))} with dividends reinvested — ${pct(headline)} annualised.`,
    },
    {
      q: `What does a ৳5,000 monthly SIP in ${fund.acronym} return per year?`,
      a:
        m.sip.irr3 === null || m.sip.final3 === null
          ? "Not enough history for a 36-month SIP replay. We would rather say that than invent a number."
          : `Over the tracked 3 years: ${taka(m.sip.final3)} from ৳1,80,000 of instalments (${pct(m.sip.irr3)} money-weighted per year). Your own dates would shift the answer; this is history, not a forecast.`,
    },
    {
      q: `What fees does ${fund.name} charge?`,
      a:
        fund.fee === null
          ? "The fee is not present in our data file, so we show “Data not available” rather than a guessed percentage."
          : `${fund.fee.toFixed(2)}% of assets per year in the committed data. Confirm the current prospectus before acting: fee structures can change.`,
    },
    {
      q: `Is ${fund.acronym} a good fund for 2026?`,
      a: `Profithisab does not make forecasts. The record: ${headline === null ? "not enough history for an annualised figure" : `${pct(headline)} per year over the stated window`}, worst NAV fall ${pct(m.worstFall, { signed: false })}, dividends ${fund.dividends.length ? `${taka(m.divPaid3y)}/unit over three years` : "not recorded in this build"}. Stack it against the certificate, FDR and inflation on this page — then decide with your own constraints.`,
    },
  ];
}
