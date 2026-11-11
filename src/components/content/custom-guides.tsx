import Link from "next/link";
import { ALL_FUNDS, BENCHES, IS_DEMO, META, metricsFor, rankedFunds } from "@/lib/returns";
import { takaExact, pct, fullDate, NOT_AVAILABLE } from "@/lib/format";
import { TypeBadge, QualityBadge } from "@/components/ui/badge";

/* ── Shared pieces ────────────────────────────────────────────────────────── */

function DemoTip() {
  if (!IS_DEMO) return null;
  return (
    <p className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-100">
      <strong>Demo data.</strong> These tables are computed from a generated demo dataset, not published fund history.
      They test the method and the layout; do not use them for investment decisions.
    </p>
  );
}

function RankTable({
  rows,
  metricLabel,
  note,
}: {
  rows: Array<{
    slug: string;
    name: string;
    amc: string;
    type: "growth" | "balanced" | "income";
    shariah: boolean;
    completeness: "complete" | "partial" | "missing";
    stale: boolean;
    v: string;
  }>;
  metricLabel: string;
  note: string;
}) {
  if (!rows.length) {
    return <p className="mt-3 rounded-xl border border-line bg-raised p-4 text-sm text-muted">Not enough history to build this table yet.</p>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line-strong text-left text-xs text-faint">
            <th className="pb-2 pr-3 font-medium">#</th>
            <th className="pb-2 pr-3 font-medium">Fund</th>
            <th className="pb-2 pr-3 font-medium">Type</th>
            <th className="pb-2 text-right font-medium">{metricLabel}</th>
          </tr>
        </thead>
        <tbody className="tnum">
          {rows.map((r, i) => (
            <tr key={r.slug} className="border-b border-line">
              <td className="py-2.5 pr-3 text-muted">{i + 1}</td>
              <td className="py-2.5 pr-3">
                <Link href={`/funds/${r.slug}`} className="font-medium hover:text-brand-700 dark:hover:text-brand-300">{r.name}</Link>
                <span className="ml-1.5 text-[10px] text-faint">{r.amc}</span>
                <div className="mt-0.5 flex flex-wrap gap-1">
                  <QualityBadge completeness={r.completeness} stale={r.stale} />
                </div>
              </td>
              <td className="py-2.5 pr-3"><TypeBadge type={r.type} shariah={r.shariah} /></td>
              <td className="py-2.5 text-right font-semibold">{r.v}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-[11px] text-faint">{note}</p>
    </div>
  );
}

function toRow(f: (typeof ALL_FUNDS)[number], value: string) {
  return {
    slug: f.slug,
    name: f.name,
    amc: f.amc,
    type: f.type,
    shariah: f.shariah,
    completeness: f.completeness,
    stale: f.isStale,
    v: value,
  };
}

/* ── Best funds (custom data guide) ──────────────────────────────────────── */

export function BestFundsGuide() {
  const sanch = BENCHES.find((b) => b.slug === "sanchayapatra");
  const fdr = BENCHES.find((b) => b.slug === "fdr");
  const sanchRate = sanch?.annualRate ?? null;

  const by3y = rankedFunds("3y");
  const sipLeague = ALL_FUNDS.filter((f) => !f.isStale && metricsFor(f.slug).sip.irr3 !== null).sort(
    (a, b) => (metricsFor(b.slug).sip.irr3 ?? -99) - (metricsFor(a.slug).sip.irr3 ?? -99)
  );
  const income = ALL_FUNDS.filter((f) => f.type === "income" && metricsFor(f.slug).g3 !== null).sort(
    (a, b) => (metricsFor(b.slug).g3 ?? -99) - (metricsFor(a.slug).g3 ?? -99)
  );
  const calmest = ALL_FUNDS.filter((f) => f.nav.length > 2 && !f.isStale && metricsFor(f.slug).worstFall < 0).sort(
    (a, b) => metricsFor(b.slug).worstFall - metricsFor(a.slug).worstFall
  );
  const beaters = sanchRate === null ? null : by3y.filter((f) => (metricsFor(f.slug).g3 ?? -99) * 100 > sanchRate).length;

  return (
    <div className="max-w-none">
      <DemoTip />
      <p className="mt-4 leading-7 text-fg-soft first:mt-0">
        No star ratings, no &ldquo;trust scores&rdquo; — one stated window, dividends reinvested, committed NAV data
        only. Rankings are recomputed from the same files the rest of the site uses, so this page and a fund page can
        never disagree. Latest NAV: {fullDate(META.latestNavDate)}.
      </p>

      <h2 id="one-number" className="mt-10 text-2xl font-bold tracking-tight">The 3-year table, per year</h2>
      <RankTable
        metricLabel="3-yr / yr"
        rows={by3y.slice(0, 15).map((f) => toRow(f, pct(metricsFor(f.slug).g3)))}
        note={`One-time total return, trailing 36 months, dividends reinvested. ${beaters === null || sanchRate === null ? "No benchmark rate is loaded." : `${beaters} of ${by3y.length} cleared the ${sanch?.status ?? "unavailable"} ${sanchRate.toFixed(2)}%/yr certificate rate.`}`}
      />
      <p className="mt-3 text-sm leading-7 text-fg-soft">
        {sanchRate === null || beaters === null ? (
          <>The certificate benchmark currently has no usable rate, so no beat-count is claimed.</>
        ) : (
          <>
            The blunt context: the loaded certificate line is labelled {sanch?.status ?? "unavailable"} at{" "}
            {sanchRate.toFixed(1)}%/yr
            {fdr?.annualRate != null ? ` and the loaded FDR line at approximately ${fdr.annualRate.toFixed(0)}%/yr` : ""}.
            On the same window, <strong className="text-fg">{beaters}</strong> of {by3y.length} funds in this build
            finished above the certificate line. That is the table, not a slogan.
          </>
        )}
      </p>

      <h2 id="sip" className="mt-10 text-2xl font-bold tracking-tight">The ৳5,000/month SIP leaders</h2>
      <p className="leading-7 text-fg-soft">
        SIPs buy through dips, so their annualised return is money-weighted. A fund that fell mid-window and recovered
        can show a different SIP rate than its one-time CAGR. These are computed, not selected:
      </p>
      <RankTable
        metricLabel="SIP / yr"
        rows={sipLeague.slice(0, 10).map((f) => toRow(f, pct(metricsFor(f.slug).sip.irr3)))}
        note={`Money-weighted IRR of 36 monthly flows of ৳5,000, dividends reinvested, ending ${fullDate(META.latestNavDate)}.`}
      />

      <h2 id="income" className="mt-10 text-2xl font-bold tracking-tight">Income funds, ranked</h2>
      <RankTable
        metricLabel="3-yr / yr"
        rows={income.map((f) => toRow(f, pct(metricsFor(f.slug).g3)))}
        note="Fixed-income funds with a usable 3-year total return."
      />

      <h2 id="calm" className="mt-10 text-2xl font-bold tracking-tight">Most comfortable rides (smallest worst falls)</h2>
      <RankTable
        metricLabel="Worst fall"
        rows={calmest.slice(0, 10).map((f) => toRow(f, pct(metricsFor(f.slug).worstFall, { signed: false })))}
        note="Largest peak-to-trough NAV fall; dividends are not used to cushion it."
      />

      <div className="card card-pad mt-8">
        <h2 className="text-lg font-semibold">How to use this page without fooling yourself</h2>
        <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-7 text-fg-soft">
          <li>Rankings reward the window, not the future. A fund can lead by chance; the fee and the worst fall are closer to permanent properties.</li>
          <li>Always cross-check the leader&apos;s <strong>worst fall</strong> — a lead bought with a deep drawdown is not the leadership you want.</li>
          <li>Compare against <Link className="underline decoration-dotted hover:text-fg" href="/guides/sanchayapatra-vs-mutual-funds">the certificate</Link>, not just other funds.</li>
          <li>Check the data-quality chip. A partial or stale series is not a ranking candidate.</li>
        </ul>
        <Link href="/compare" className="btn-cta mt-4">Put your shortlist on one table →</Link>
      </div>
    </div>
  );
}

/* ── Sanchayapatra vs mutual funds (custom data guide) ───────────────────── */

export function SanchayapatraGuide() {
  const sanch = BENCHES.find((b) => b.slug === "sanchayapatra");
  const fdr = BENCHES.find((b) => b.slug === "fdr");
  const inflation = BENCHES.find((b) => b.slug === "inflation");

  const SANCH = sanch?.annualRate ?? null;
  const SANCH_STATUS = sanch?.status ?? "unavailable";
  const FDR = fdr?.annualRate ?? null;
  const INFL = inflation?.annualRate ?? null;

  const funds = ALL_FUNDS.filter((f) => metricsFor(f.slug).g3 !== null && !f.isStale);
  const winners = SANCH === null ? [] : funds.filter((f) => (metricsFor(f.slug).g3 ?? -99) * 100 > SANCH)
    .sort((a, b) => (metricsFor(b.slug).g3 ?? -99) - (metricsFor(a.slug).g3 ?? -99));

  const dist = funds.map((f) => (metricsFor(f.slug).g3 ?? 0) * 100);
  const best = dist.length ? Math.max(...dist) : null;
  const worst = dist.length ? Math.min(...dist) : null;
  const above = (x: number | null) => (x === null ? null : dist.filter((v) => v > x).length);

  return (
    <div className="max-w-none">
      <DemoTip />
      <p className="first:mt-0 mt-4 leading-7 text-fg-soft">
        It is the transaction at the heart of many Bangladeshi savings decisions: a government certificate with an
        implicit state guarantee, versus mutual fund units with a market price and no promises. Taxes and fees change
        the answer, so they stay visible.
      </p>

      <h2 id="numbers" className="mt-10 text-2xl font-bold tracking-tight">Same window, honest decimals</h2>
      <div className="mt-5 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line-strong text-left text-xs text-faint">
              <th className="pb-2 pr-3 font-medium">Instrument</th>
              <th className="pb-2 pr-3 font-medium">Rate</th>
              <th className="pb-2 pr-3 font-medium">৳100k → value after 3 yr</th>
              <th className="pb-2 font-medium">Fine print</th>
            </tr>
          </thead>
          <tbody className="tnum">
            {[
              {
                name: "Sanchayapatra (3-yr, par)",
                rate: SANCH,
                value: SANCH === null ? NOT_AVAILABLE : takaExact(100000 * Math.pow(1 + SANCH / 100, 3)),
                note: sanch?.note ?? NOT_AVAILABLE,
              },
              {
                name: "Bank FDR (working average)",
                rate: FDR,
                value: FDR === null ? NOT_AVAILABLE : takaExact(100000 * Math.pow(1 + FDR / 100, 3)),
                note: fdr?.note ?? NOT_AVAILABLE,
              },
              {
                name: "Inflation (CPI, working average)",
                rate: INFL,
                value: INFL === null ? NOT_AVAILABLE : takaExact(100000 * Math.pow(1 + INFL / 100, 3)),
                note: inflation?.note ?? NOT_AVAILABLE,
              },
              {
                name: "Best tracked fund (3-yr/yr)",
                rate: best,
                value: best === null ? NOT_AVAILABLE : takaExact(100000 * Math.pow(1 + best / 100, 3)),
                note: "Dividends reinvested; no guarantee this fund repeats.",
              },
              {
                name: "Worst tracked fund (3-yr/yr)",
                rate: worst,
                value: worst === null ? NOT_AVAILABLE : takaExact(100000 * Math.pow(1 + worst / 100, 3)),
                note: "Yes, really — this sits in the tracked universe.",
              },
            ].map((r) => (
              <tr key={r.name} className="border-b border-line">
                <td className="py-2.5 pr-3 font-medium">{r.name}</td>
                <td className="py-2.5 pr-3 font-semibold">{r.rate === null ? NOT_AVAILABLE : `${r.rate.toFixed(2)}%`}</td>
                <td className="py-2.5 pr-3">{r.value}</td>
                <td className="py-2.5 text-xs text-fg-soft">{r.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-[11px] text-faint">
        Window: the fixed 3-year NAV window ending {fullDate(META.latestNavDate)}. Certificate and deposit rates are
        nominal (before personal tax) and labelled {SANCH_STATUS} in <code>data/benchmarks.json</code>.
      </p>

      <h2 id="who-wins" className="mt-10 text-2xl font-bold tracking-tight">Who actually beat the certificate</h2>
      {SANCH === null ? (
        <p className="mt-3 rounded-xl border border-line bg-raised p-4 text-sm text-muted">
          The certificate benchmark has no usable rate in <code>data/benchmarks.json</code>, so this comparison is not
          claimed.
        </p>
      ) : (
        <>
          <p className="leading-7 text-fg-soft">
            Out of {funds.length} funds with a full 3-year window, <strong className="text-fg">{winners.length}</strong>{" "}
            finished above the loaded {SANCH.toFixed(2)}% {SANCH_STATUS} certificate line:
          </p>
          {winners.length ? (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-line-strong text-left text-xs text-faint">
                    <th className="pb-2 pr-3 font-medium">#</th>
                    <th className="pb-2 pr-3 font-medium">Fund</th>
                    <th className="pb-2 pr-3 font-medium">3-yr/yr</th>
                    <th className="pb-2 pr-3 font-medium">Gap</th>
                    <th className="pb-2 pr-3 font-medium">Worst fall</th>
                    <th className="pb-2 font-medium">Fee</th>
                  </tr>
                </thead>
                <tbody className="tnum">
                  {winners.map((f, i) => {
                    const m = metricsFor(f.slug);
                    const g = (m.g3 ?? 0) * 100;
                    return (
                      <tr key={f.slug} className="border-b border-line">
                        <td className="py-2.5 pr-3 text-muted">{i + 1}</td>
                        <td className="py-2.5 pr-3 font-medium">
                          <Link href={`/funds/${f.slug}`} className="hover:text-brand-700 dark:hover:text-brand-300">{f.name}</Link>
                          <span className="ml-1.5 text-[10px] text-faint">{f.amc}</span>
                        </td>
                        <td className="py-2.5 pr-3 font-semibold text-brand-600 dark:text-brand-400">{pct(m.g3)}</td>
                        <td className="py-2.5 pr-3">{g - SANCH >= 0 ? "+" : ""}{(g - SANCH).toFixed(1)} pp</td>
                        <td className="py-2.5 pr-3">{pct(m.worstFall, { signed: false })}</td>
                        <td className="py-2.5">{f.fee === null ? NOT_AVAILABLE : `${f.fee.toFixed(2)}%`}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="mt-3 text-fg-soft">None. This is the point the brochures skip.</p>
          )}
        </>
      )}

      <h2 id="distribution" className="mt-10 text-2xl font-bold tracking-tight">The distribution brochures leave out</h2>
      <p className="leading-7 text-fg-soft">
        Over the same window: {above(12) ?? NOT_AVAILABLE} funds earned above 12%/yr, {above(9) ?? NOT_AVAILABLE} above
        9%, {above(SANCH) ?? NOT_AVAILABLE} above the certificate line, and {above(INFL) ?? NOT_AVAILABLE} above the
        loaded inflation approximation. The rest compounded below one or more of those lines.
      </p>

      <div className="card card-pad mt-8">
        <h2 className="text-lg font-semibold">The honest buyer&apos;s checklist</h2>
        <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-7 text-fg-soft">
          <li>Certificate money is sleep money: principal safety, a fixed rate and a sovereign guarantee. Nothing else in this universe is that combination.</li>
          <li>Fund money is growth money: no promises, real drawdowns, and a shot at outrunning inflation over long periods.</li>
          <li>If a fund cannot beat the certificate across a stated window while charging a market fee, ask hard questions before letting it manage your savings.</li>
          <li>Taxes and eligibility differ per person. Use net figures for your own case.</li>
        </ul>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/funds" className="btn-cta">Browse the funds →</Link>
          <Link href="/guides/mutual-fund-tax-bangladesh" className="btn-quiet">Tax rules behind these numbers →</Link>
        </div>
      </div>
    </div>
  );
}
