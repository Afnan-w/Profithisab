import type { Metadata } from "next";
import Link from "next/link";
import { ATTRIBUTION, BENCHES, IS_DEMO, LICENSE, META, STATS } from "@/lib/returns";
import { pageMeta } from "@/lib/seo";
import { fullDate } from "@/lib/format";

export const metadata: Metadata = pageMeta({
  title: "Methodology — how every Profithisab number is built",
  description:
    "Total return = published NAVs + dividends; 1/3/5-year and since-launch windows; money-weighted SIP IRRs; drawdowns on NAV; fees from the data file. Full formulas, benchmark labels and dataset status.",
  path: "/methodology",
});

export default function MethodologyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 pt-10 sm:px-6">
      <nav aria-label="Breadcrumb" className="mb-3 text-xs text-muted">
        <Link href="/" className="hover:text-fg">Home</Link> → <span className="text-fg">Methodology</span>
      </nav>

      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Methodology — no black box, no vibes</h1>
      <p className="mt-3 text-lg leading-relaxed text-muted">
        Every number on Profithisab is reproducible from the committed data files and the formulas below. If we
        cannot show how a figure was built, it does not go on the site.
      </p>

      <div className="mt-10 space-y-10">
        <section>
          <h2 className="text-2xl font-bold tracking-tight">Total return (the headline)</h2>
          <p className="mt-2 leading-7 text-fg-soft">
            Start with one unit bought at the window&apos;s first published NAV. Walk through the published NAVs.
            When a dividend is declared, either buy more units at the first published NAV on or after the record
            date (reinvested) or add the cash to the holding (cash). The ratio of final value to initial value,
            annualised geometrically, is the per-year figure.
          </p>
          <div className="card card-pad mt-4 text-sm text-muted">
            CAGR = (V<sub>end</sub> / V<sub>start</sub>)<sup>365 / days</sup> − 1. A period shorter than 90 days is
            not annualised, because doing so would turn noise into a headline.
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold tracking-tight">Windows, not cherry-picks</h2>
          <p className="mt-2 leading-7 text-fg-soft">
            The site computes 1-year, 3-year, 5-year and since-launch figures from the same stored history. Each
            figure names the actual start and end NAV dates. A fund that is too young for a window shows
            &ldquo;Not enough history&rdquo;; it is never measured over a shorter period and presented as if it
            were the requested one. The latest NAV in the dataset is {fullDate(META.latestNavDate)}.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold tracking-tight">SIP arithmetic</h2>
          <p className="mt-2 leading-7 text-fg-soft">
            A monthly SIP buys a fixed ৳ amount of units at each month-end NAV in the window. Dividends follow the
            same reinvest-or-cash rule as the lump sum. The quoted SIP return is the money-weighted IRR of the
            purchase and final-value cash flows, solved by bisection. A SIP and a lump sum can land on very
            different annual numbers; both are shown, neither is hidden.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold tracking-tight">Risk and consistency</h2>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 leading-7 text-fg-soft">
            <li><strong>Worst fall</strong> — largest peak-to-trough drop of the NAV line itself (no dividend cushioning).</li>
            <li><strong>Volatility</strong> — annualised standard deviation of month-end NAV log-returns.</li>
            <li><strong>Positive months</strong> — share of trailing months where NAV rose or held.</li>
            <li><strong>Beta versus DSEX</strong> — not shown. No cited DSEX history is loaded, and a generated index path would be fake precision.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold tracking-tight">Which funds are tracked</h2>
          <p className="mt-2 leading-7 text-fg-soft">
            This build contains {STATS.funds} open-end funds across {STATS.amcs} asset managers. That is the roster
            whose NAV and dividend files are present — not a claim to cover every fund in Bangladesh. Selection is by
            data availability, not by marketing friendliness. Closed-end listed funds (which trade at exchange prices
            that can diverge from NAV) are out of scope for headline maths.
          </p>
          <p className="mt-2 text-sm text-faint">
            Data-quality flags: <strong>Complete</strong> = NAV, fee, size and launch date present and latest NAV within
            30 days; <strong>Partial</strong> = something material missing; <strong>Missing</strong> = no NAV rows;
            <strong>Stale</strong> = no NAV in 30+ days, excluded from rankings. There is no paid verification badge in
            this build.
          </p>
        </section>

        <section id="data-status" className="scroll-mt-20">
          <h2 className="text-2xl font-bold tracking-tight">Data status — read this if the numbers matter</h2>
          <div
            className={`card card-pad mt-3 ${
              IS_DEMO
                ? "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40"
                : "border-line"
            }`}
          >
            {IS_DEMO ? (
              <>
                <p className="text-sm leading-7">
                  <strong>This build is serving a demo dataset.</strong> The fund names, fees, sizes and dates come
                  from the previous layout-testing dataset; the NAV paths were generated to reproduce its anchors.
                  They are <strong>not published fund history</strong>. Every page carries a &ldquo;Demo data&rdquo;
                  banner so the distinction is impossible to miss.
                </p>
                <p className="mt-2 text-sm leading-7">
                  The importer (<code className="rounded bg-black/5 px-1 dark:bg-white/10">npm run data:import</code>)
                  is ready and refuses to publish a real export until <code>data/license.json</code> records the
                  permission, attribution and permitted uses. That gate is deliberate.
                </p>
              </>
            ) : (
              <>
                <p className="text-sm leading-7">
                  <strong>This build is serving imported data.</strong> {STATS.complete} funds have complete records,
                  {" "}{STATS.partial} are partial and {STATS.missing} have no NAV. {STATS.stale} are stale and excluded
                  from rankings. The latest NAV date is {fullDate(META.latestNavDate)}.
                </p>
                {ATTRIBUTION ? (
                  <p className="mt-2 text-sm leading-7">
                    Required attribution:{" "}
                    {ATTRIBUTION.url ? (
                      <a href={ATTRIBUTION.url} target="_blank" rel="noopener noreferrer" className="underline decoration-dotted">
                        {ATTRIBUTION.text}
                      </a>
                    ) : (
                      ATTRIBUTION.text
                    )}
                  </p>
                ) : (
                  <p className="mt-2 text-sm leading-7 text-amber-800 dark:text-amber-200">
                    No attribution text is recorded in <code>data/license.json</code> yet. Add it before relying on
                    this build for publication.
                  </p>
                )}
                <p className="mt-2 text-sm leading-7">
                  Source recorded in the licence file: <strong>{LICENSE.sourceName || "not named"}</strong>
                  {LICENSE.sourceUrl ? (
                    <>
                      {" — "}
                      <a href={LICENSE.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline decoration-dotted">
                        visit source
                      </a>
                    </>
                  ) : null}
                  . Automated fetching is {LICENSE.automatedFetching ? "permitted" : "not permitted"}.
                </p>
              </>
            )}
            <p className="mt-3 text-sm font-medium">
              <Link href="/data-status" className="underline decoration-dotted hover:text-fg">
                Open the per-fund data status table →
              </Link>
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold tracking-tight">The benchmarks we compare against</h2>
          <ul className="mt-2 space-y-3 leading-7 text-fg-soft">
            {BENCHES.map((b) => (
              <li key={b.slug}>
                <strong>{b.name}</strong>{" "}
                <span className="tnum text-muted">
                  {b.status === "unavailable" || b.annualRate === null
                    ? "— unavailable"
                    : `(${b.annualRate.toFixed(2)}%/yr, ${b.status})`}
                </span>
                <span className="text-sm text-muted"> — {b.note}</span>
                <span className="block text-xs text-faint">
                  Source: {b.source.name}
                  {b.source.url ? (
                    <>
                      {" · "}
                      <a href={b.source.url} target="_blank" rel="noopener noreferrer" className="underline decoration-dotted">
                        citation
                      </a>
                    </>
                  ) : (
                    " · no official URL yet"
                  )}
                  {b.source.asOf ? ` · as of ${b.source.asOf}` : ""}
                </span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-faint">
            Sanchayapatra, FDR and inflation are currently labelled <strong>approximate</strong>. Their lines are
            working averages, not official product rates. Personal source tax is not netted into the lines.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold tracking-tight">What we refuse to do</h2>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 leading-7 text-fg-soft">
            <li>Window-shop: no per-fund start dates, no post-crash resets.</li>
            <li>Invent a number: missing values stay missing, and short history stays short.</li>
            <li>Draw a benchmark we cannot cite: gold and DSEX are marked unavailable.</li>
            <li>Let partner fees touch a single digit in the tables.</li>
            <li>Hide the boring parts: fees, drawdowns, stale flags and row counts sit beside the headlines.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold tracking-tight">Sources &amp; credits</h2>
          <p className="mt-2 leading-7 text-fg-soft">
            NAV and dividend rows come from the files committed under <code>/data</code>. They are fetched directly from
            the primary sources — each asset management company&apos;s own published NAV history — plus a weekly fund-universe
            snapshot from the LankaBangla Financial Portal. Every source, its URL and the politeness rules for the
            fetcher are listed in <code>data/sources.json</code>; the permission record and attribution wording live in{" "}
            <code>data/license.json</code>. When a fund publishes more than one NAV figure, we use the standard quoted
            NAV (“NAV at Fair Value” / “NAV Per Unit at Market Price”) and ignore NAV-at-cost and buy/sell prices,
            because those embed fees and are not comparable across funds. Fee and size fields are whatever those files
            carry — when absent, the site says so. Benchmarks are separate records with their own status labels. All
            arithmetic runs in-house through the open formulas above.
          </p>
          <p className="mt-3 text-sm text-faint">
            Found a number that looks wrong? That is a data question, not a marketing one:{" "}
            <a className="underline decoration-dotted hover:text-fg" href={`mailto:${LICENSE.contact || "data@profithisab.com"}`}>
              {LICENSE.contact || "data@profithisab.com"}
            </a>
            . Where the data cannot support a figure, the page says “Data not available” or “Not enough history” —
            never a guess.
          </p>
        </section>
      </div>

      <p className="mt-10 pb-14 text-xs text-faint">
        Dataset generated {fullDate(META.lastUpdated)} · latest NAV {fullDate(META.latestNavDate)} ·{" "}
        {STATS.funds} funds · {IS_DEMO ? "DEMO data" : "imported data"}.
      </p>
    </div>
  );
}
