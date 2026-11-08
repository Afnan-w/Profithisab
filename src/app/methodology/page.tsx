import type { Metadata } from "next";
import Link from "next/link";
import { ALL_FUNDS, AMCs, VERIFIED_COUNT } from "@/lib/returns";
import { BENCHES, benchBySlug } from "@/lib/benchmarks";
import { pageMeta } from "@/lib/seo";
import { site } from "@/lib/site";
import { longDate } from "@/lib/format";

export const metadata: Metadata = pageMeta({
  title: "Methodology — how every Profithisab number is built",
  description:
    "Total return = published NAVs + dividends reinvested; one fixed 3-year window for every fund; money-weighted SIP IRRs; drawdowns on NAV; fees straight from prospectuses. Full formulas, benchmark sources and dataset status.",
  path: "/methodology",
});

export default function MethodologyPage() {
  const sanch = benchBySlug("sanchay3");
  return (
    <div className="mx-auto max-w-3xl px-4 pt-10 sm:px-6">
      <nav aria-label="Breadcrumb" className="mb-3 text-xs text-muted">
        <Link href="/" className="hover:text-fg">Home</Link> → <span className="text-fg">Methodology</span>
      </nav>

      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Methodology — no black box, no vibes</h1>
      <p className="mt-3 text-lg leading-relaxed text-muted">
        Every number on Profithisab is reproducible from published data and the formulas below. If we can&apos;t
        show how a figure was built, it doesn&apos;t go on the site.
      </p>

      <div className="mt-10 space-y-10">
        <section>
          <h2 className="text-2xl font-bold tracking-tight">Total return (the headline)</h2>
          <p className="mt-2 leading-7 text-fg-soft">
            Start with one unit bought at the window&apos;s first published NAV (৳100,000 of units for the replay
            card). Walk month by month using published month-end NAVs. When a dividend is declared, buy more
            units at that month&apos;s NAV. Repeat until the latest NAV month. The ratio of final value to
            initial value, annualized geometrically, is the per-year figure.
          </p>
          <div className="card card-pad mt-4 text-sm text-muted">
            V(T) = u(T) × NAV(T), where units u grow by d/k ÷ NAV(k) at each dividend month k. CAGR = (V(T)/V(0))^(12/m) − 1.
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold tracking-tight">The fixed 3-year window</h2>
          <p className="mt-2 leading-7 text-fg-soft">
            All headline one-time figures use the trailing 36 published months — the same months for every fund,
            currently ending {longDate(site.asOf)}. Funds with under 3 years of history show their
            since-inception rate and are marked as such. The window is never adjusted to flatter a fund.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold tracking-tight">SIP arithmetic</h2>
          <p className="mt-2 leading-7 text-fg-soft">
            A monthly SIP buys ৳5,000 of units at each of 36 consecutive month-end NAVs (your window: any amount
            on the homepage). Dividends reinvest. The quoted &ldquo;SIP return / year&rdquo; is the money-weighted
            IRR of those flows — a fund can show a better SIP rate than one-time CAGR when dips happened while
            you were still buying. Both numbers are reported for the same fund.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold tracking-tight">Worst fall, volatility, beta, consistency</h2>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 leading-7 text-fg-soft">
            <li><strong>Worst fall</strong> — largest peak-to-trough drop of the NAV line itself (no dividend cushioning). Matches what statements feel.</li>
            <li><strong>Volatility</strong> — annualized standard deviation of monthly NAV moves over the trailing 36 months.</li>
            <li><strong>Beta</strong> — covariance of fund monthly NAV moves with the DSEX price index, divided by index variance (same 36 months).</li>
            <li><strong>Positive months</strong> — share of the trailing 36 months where total value (NAV + dividends) rose or held.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold tracking-tight">Which funds get tracked</h2>
          <p className="mt-2 leading-7 text-fg-soft">
            We track {ALL_FUNDS.length} open-end funds across {AMCs.length} managers: the ones whose monthly NAV
            and dividend history is published consistently enough to reconstruct returns without holes.
            Selection is by data quality, not by marketing friendliness. Closed-end listed funds (which trade at
            exchange prices that can diverge from NAV) are out of scope for headline maths and explained in the{" "}
            <Link className="underline decoration-dotted hover:text-fg" href="/guides/mutual-funds-explained-simply">learn guides</Link>.
          </p>
          <p className="mt-2 text-sm text-faint">
            Verification levels: AMC-Verified ({VERIFIED_COUNT} funds) = series cross-checked with the asset
            manager itself. Featured tickers otherwise use published NAV feeds and are labelled
            un-verified until the check completes.
          </p>
        </section>

        <section id="data-status" className="scroll-mt-20">
          <h2 className="text-2xl font-bold tracking-tight">Data status — read this if the numbers matter (they do)</h2>
          <div className="card card-pad mt-3 border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40">
            <p className="text-sm leading-7">
              This launch build ships an <strong>anchored demo dataset</strong>. The fund roster, AMCs, fees,
              AUMs, verification flags and headline anchors (3-year, since-launch, worst fall · as of{" "}
              {longDate(site.asOf)}) mirror the published figures. The month-by-month NAV path is reconstructed
              to reproduce those anchors exactly — CI runs the calibration through the same engine that renders
              every chart, so all figures on screen are internally consistent with the documented formulas.
            </p>
            <p className="mt-2 text-sm leading-7">
              Meaning: dates, anchors, names, fees, sizes and verification states are real; the monthly path is
              a principled reconstruction rather than verbatim history <em>yet</em>. The swap-in of verbatim NAV
              series is a documented pipeline (<code className="rounded bg-black/5 px-1 dark:bg-white/10">npm run data:import</code>{" "}
              — see README) and the methodology will not change when it lands.
            </p>
          </div>
        </section>

        <section>
          <h2 className="text-2xl font-bold tracking-tight">The benchmarks we compare against</h2>
          <ul className="mt-2 space-y-3 leading-7 text-fg-soft">
            {BENCHES.map((b) => (
              <li key={b.slug}>
                <strong>{b.name}</strong> <span className="tnum text-muted">({b.ann.g3.toFixed(1)}%/yr in our tables)</span> —
                <span className="text-sm text-muted"> {b.note}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-sm text-faint">
            {sanch.name}: rate applies at par for the stated maturity; personal source tax on interest varies by
            buyer category and is not netted into Profithisab&apos;s lines — the tax guide separates gross from net honestly.
          </p>
        </section>

        <section>
          <h2 className="text-2xl font-bold tracking-tight">What we refuse to do</h2>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 leading-7 text-fg-soft">
            <li>Window-shop: no per-fund start dates, no post-crash resets.</li>
            <li>Score-scams: no proprietary &ldquo;trust ratings&rdquo; you can&apos;t recompute from published data.</li>
            <li>Sell silence: partner fees cannot touch a single digit — the incentives page lives on every invest page.</li>
            <li>Hide the boring parts: fees, exit loads and drawdowns sit beside every headline.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-2xl font-bold tracking-tight">Sources &amp; credits</h2>
          <p className="mt-2 leading-7 text-fg-soft">
            NAV and dividend disclosures from asset managers (and the official feeds they report through), fee
            and policy terms from each fund&apos;s prospectus, certificate and deposit rates from published savings
            instruments&apos; terms, CPI from Bangladesh BBS releases, and market levels from DSE&apos;s DSEX index.
            Calculates run in-house through the open formulas above.
          </p>
        </section>
      </div>

      <p className="mt-10 pb-14 text-xs text-faint">Questions or a correction: <a className="underline decoration-dotted hover:text-fg" href="mailto:data@Profithisab.com">data@Profithisab.com</a></p>
    </div>
  );
}
