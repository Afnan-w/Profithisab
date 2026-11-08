import Link from "next/link";
import { ALL_FUNDS, metricsFor } from "@/lib/returns";
import { BENCHES } from "@/lib/benchmarks";
import { takaExact, pct, longDate } from "@/lib/format";
import { TypeBadge, VerifiedBadge } from "@/components/ui/badge";
import { site } from "@/lib/site";

/* ── Shared pieces ────────────────────────────────────────────────────────── */

function RankTable({
  rows,
  colsHead,
  metricLabel,
  className = "",
}: {
  rows: Array<{ slug: string; name: string; amc: string; type: string; shariah: boolean; verified: boolean; v: string; sub: string }>;
  colsHead: string[];
  metricLabel: string;
  className?: string;
}) {
  return (
    <div className={`overflow-x-auto ${className}`}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-line-strong text-left text-xs text-faint">
            <th className="pb-2 pr-3 font-medium">#</th>
            <th className="pb-2 pr-3 font-medium">Fund</th>
            {colsHead.map((h) => (
              <th key={h} className="pb-2 pr-3 font-medium">{h}</th>
            ))}
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
                <div className="mt-0.5 flex gap-1">
                  {r.shariah ? <span className="chip !py-0">Shariah</span> : null}
                  {r.verified ? <VerifiedBadge /> : null}
                </div>
              </td>
              {colsHead.map((_, k) => (
                <td key={k} className="py-2.5 pr-3 text-fg-soft">{k === 0 ? <TypeBadgeMini type={r.type} /> : ""}</td>
              ))}
              <td className="py-2.5 text-right font-semibold">{r.v}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-2 text-[11px] text-faint">{rows[0]?.sub}</p>
    </div>
  );
}

function TypeBadgeMini({ type }: { type: string }) {
  const color = type === "growth" ? "text-brand-700 dark:text-brand-300" : type === "balanced" ? "text-violet-700 dark:text-violet-300" : "text-slate-700 dark:text-slate-300";
  return <span className={`text-xs capitalize ${color}`}>{type}</span>;
}

function withRows(fn: (f: typeof ALL_FUNDS[number]) => { v: string; sub: string } | null, sorted: typeof ALL_FUNDS) {
  return sorted.map((f) => ({
    slug: f.slug,
    name: f.name,
    amc: f.amc,
    type: f.type,
    shariah: f.shariah,
    verified: f.verified,
    ...(fn(f) ?? { v: "—", sub: "" }),
  }));
}

/* ── Best funds (custom data guide) ──────────────────────────────────────── */

export function BestFundsGuide() {
  const SANCH = BENCHES[0].ann.g3;

  const by3y = ALL_FUNDS.filter((f) => metricsFor(f.slug).g3 !== null)
    .sort((a, b) => (metricsFor(b.slug).g3 ?? -99) - (metricsFor(a.slug).g3 ?? -99));

  const bySip = ALL_FUNDS.filter((f) => metricsFor(f.slug).sip.irr3 !== null)
    .sort((a, b) => (metricsFor(b.slug).sip.irr3 ?? -99) - (metricsFor(a.slug).sip.irr3 ?? -99))
    .slice(0, 10);

  const income = ALL_FUNDS.filter((f) => f.type === "income" && metricsFor(f.slug).g3 !== null)
    .sort((a, b) => (metricsFor(b.slug).g3 ?? -99) - (metricsFor(a.slug).g3 ?? -99));

  const calmest = [...ALL_FUNDS].sort(
    (a, b) => metricsFor(a.slug).worstFall - metricsFor(b.slug).worstFall
  );

  const beaters = ALL_FUNDS.filter((f) => (metricsFor(f.slug).g3 ?? -99) > SANCH / 100).length;

  return (
    <div className="max-w-none">
      <p className="mt-4 leading-7 text-fg-soft first:mt-0">
        No star ratings, no &quot;trust scores&quot; — one fixed 3-year window (ending {longDate(site.asOf)}), dividends
        reinvested, published NAVs only. Rankings refresh when the window rolls; the method never changes, so
        this month&apos;s table and last month&apos;s are actually comparable.
      </p>

      <h2 id="one-number" className="mt-10 text-2xl font-bold tracking-tight">The one-number leaderboard (3-year, per year)</h2>
      <RankTable
        metricLabel="3-yr / yr"
        colsHead={["Type"]}
        rows={by3y.slice(0, 15).map((f) => ({
          slug: f.slug, name: f.name, amc: f.amc, type: f.type, shariah: f.shariah, verified: f.verified,
          v: pct(metricsFor(f.slug).g3),
          sub: `One-time total return, trailing 36 months, dividends reinvested. ${beaters} of ${ALL_FUNDS.length} beat Sanchayapatra's ~${SANCH.toFixed(2)}%/yr.`,
        }))}
      />
      <p className="mt-3 text-sm leading-7 text-fg-soft">
        The blunt context: at a time when the government certificate pays ~{SANCH.toFixed(1)}% and FDR banks offer
        ~{BENCHES[1].ann.g3.toFixed(0)}%, only <strong className="text-fg">{beaters}</strong> of the {ALL_FUNDS.length} funds we track
        cleared the certificate over the same three years — and none did so comfortably after their drawdowns are
        priced in. That is not a bug in the data; that&apos;s the market.
      </p>

      <h2 id="sip" className="mt-10 text-2xl font-bold tracking-tight">The ৳5,000/month SIP leaders</h2>
      <p className="leading-7 text-fg-soft">
        SIPs buy through dips — their annualized return is money-weighted, so a fund that fell mid-window (early
        2024) and recovered can show a *better* SIP number than its one-time CAGR. These are the funds where
        the automated discipline flattered you most:
      </p>
      <RankTable
        metricLabel="SIP / yr"
        colsHead={["Type"]}
        rows={withRows(
          (f) => {
            const m = metricsFor(f.slug);
            return { v: pct(m.sip.irr3), sub: "" };
          },
          bySip
        )}
        className="mt-5"
      />
      <p className="mt-2 text-[11px] text-faint">
        Money-weighted IRR of 36 monthly flows of ৳5,000, dividends reinvested, ending {longDate(site.asOf)}.
      </p>

      <h2 id="income" className="mt-10 text-2xl font-bold tracking-tight">Income funds — the kettle-warmers, ranked</h2>
      <RankTable
        metricLabel="3-yr / yr"
        colsHead={["Type", "Fee"]}
        rows={income.map((f) => ({
          slug: f.slug, name: f.name, amc: f.amc, type: f.type, shariah: f.shariah, verified: f.verified,
          v: pct(metricsFor(f.slug).g3),
          sub: "",
        })) as never}
      />

      <h2 id="calm" className="mt-10 text-2xl font-bold tracking-tight">Most comfortable rides (smallest worst falls)</h2>
      <RankTable
        metricLabel="Worst fall"
        colsHead={["Type"]}
        rows={calmest.slice(0, 10).map((f) => ({
          slug: f.slug, name: f.name, amc: f.amc, type: f.type, shariah: f.shariah, verified: f.verified,
          v: pct(metricsFor(f.slug).worstFall, { signed: false }),
          sub: "",
        }))}
      />

      <div className="card card-pad mt-8">
        <h2 className="text-lg font-semibold">How to use this page without fooling yourself</h2>
        <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-7 text-fg-soft">
          <li>Rankings reward the *window*, not the future. A fund can lead by chance; only the fee and the worst fall are close to permanent properties.</li>
          <li>Always cross-check the leader&apos;s <strong>worst fall</strong> — a 15% lead bought with a 25% drawdown pause is not the leadership you want.</li>
          <li>Compare against <Link className="underline decoration-dotted hover:text-fg" href="/guides/sanchayapatra-vs-mutual-funds">the certificate</Link>, not just other funds.</li>
          <li>Then decide on your own constraints: Shariah screen, liquidity, fee scale.</li>
        </ul>
        <Link href="/compare" className="btn-cta mt-4">Put your shortlist on one table →</Link>
      </div>
    </div>
  );
}

/* ── Sanchayapatra vs mutual funds (custom data guide) ───────────────────── */

export function SanchayapatraGuide() {
  const SANCH = BENCHES[0].ann.g3;
  const FDR = BENCHES[1].ann.g3;
  const INFL = BENCHES[2].ann.g3;

  const funds = ALL_FUNDS.filter((f) => metricsFor(f.slug).g3 !== null);
  const winners = funds.filter((f) => (metricsFor(f.slug).g3 ?? -99) > SANCH / 100)
    .sort((a, b) => (metricsFor(b.slug).g3 ?? -99) - (metricsFor(a.slug).g3 ?? -99));

  const dist = funds.map((f) => metricsFor(f.slug).g3 ?? 0);
  const best = Math.max(...dist);
  const worst = Math.min(...dist);
  const above = (x: number) => dist.filter((v) => v * 100 > x).length;

  return (
    <div className="max-w-none">
      <p className="first:mt-0 mt-4 leading-7 text-fg-soft">
        It&apos;s the transaction at the heart of every Bangladeshi savings decision: the 11%-ish government
        certificate with an implicit state guarantee, versus mutual fund units with a market price and no
        promises. Guilts, taxes and fees included below.
      </p>

      <h2 id="numbers" className="mt-10 text-2xl font-bold tracking-tight">Same window, honest decimals</h2>
      <div className="mt-5 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-line-strong text-left text-xs text-faint">
              <th className="pb-2 pr-3 font-medium">Instrument</th>
              <th className="pb-2 pr-3 font-medium">Rate (this window)</th>
              <th className="pb-2 pr-3 font-medium">৳100k → value after 3 yr</th>
              <th className="pb-2 font-medium">Fine print</th>
            </tr>
          </thead>
          <tbody className="tnum">
            {[
              ["Sanchayapatra (3-yr, par)", `${SANCH.toFixed(2)}%`, takaExact(100000 * Math.pow(1 + SANCH / 100, 3)), "State certificate; source tax on interest applies by category."],
              [`Bank FDR (avg)`, `${FDR.toFixed(1)}%`, takaExact(100000 * Math.pow(1 + FDR / 100, 3)), "By category; rates move with policy; reinvestment assumption."],
              [`Inflation (CPI)`, `≈${INFL.toFixed(1)}%`, takaExact(100000 * Math.pow(1 + INFL / 100, 3)), "What 'not losing purchasing power' actually means."],
              ["Best tracked fund (3-yr/yr)", `${(best * 100).toFixed(2)}%`, takaExact(100000 * Math.pow(1 + best, 3)), "Dividends reinvested; no guarantee this fund repeats."],
              ["Worst tracked fund (3-yr/yr)", `${(worst * 100).toFixed(2)}%`, takaExact(100000 * Math.pow(1 + worst, 3)), "Yes, really — this sits in the tracked universe."],
            ].map((r) => (
              <tr key={r[0]} className="border-b border-line">
                <td className="py-2.5 pr-3 font-medium">{r[0]}</td>
                <td className="py-2.5 pr-3 font-semibold">{r[1]}</td>
                <td className="py-2.5 pr-3">{r[2]}</td>
                <td className="py-2.5 text-xs text-fg-soft">{r[3]}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-[11px] text-faint">Window: the fixed 3-year NAV window ending {longDate(site.asOf)}. Rates are nominal (before personal tax).</p>

      <h2 id="who-wins" className="mt-10 text-2xl font-bold tracking-tight">Who actually beat the certificate</h2>
      <p className="leading-7 text-fg-soft">
        Out of {funds.length} funds with a full 3-year window, <strong className="text-fg">{winners.length}</strong> finished
        above {SANCH.toFixed(2)}% per year:
      </p>
      {winners.length ? (
        <div className="mt-5 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-line-strong text-left text-xs text-faint">
                <th className="pb-2 pr-3 font-medium">#</th>
                <th className="pb-2 pr-3 font-medium">Fund</th>
                <th className="pb-2 pr-3 font-medium">3-yr/yr</th>
                <th className="pb-2 pr-3 font-medium">Certificate-GAP</th>
                <th className="pb-2 pr-3 font-medium">Worst fall</th>
                <th className="pb-2 font-medium">Fee</th>
              </tr>
            </thead>
            <tbody className="tnum">
              {winners.map((f, i) => {
                const m = metricsFor(f.slug);
                const g = (m.g3 ?? m.gMax ?? 0) * 100;
                return (
                  <tr key={f.slug} className="border-b border-line">
                    <td className="py-2.5 pr-3 text-muted">{i + 1}</td>
                    <td className="py-2.5 pr-3 font-medium">
                      <Link href={`/funds/${f.slug}`} className="hover:text-brand-700 dark:hover:text-brand-300">{f.name}</Link>
                      <span className="ml-1.5 text-[10px] text-faint">{f.amc}</span>
                    </td>
                    <td className="py-2.5 pr-3 font-semibold text-brand-600 dark:text-brand-400">{pct(g)}</td>
                    <td className="py-2.5 pr-3">{g - SANCH >= 0 ? "+" : "-"}{(Math.abs(g - SANCH)).toFixed(1)} pp</td>
                    <td className="py-2.5 pr-3">{pct(m.worstFall, { signed: false })}</td>
                    <td className="py-2.5">{f.fee.toFixed(2)}%</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="mt-3 text-fg-soft">None. This is the point the brochures skip.</p>
      )}

      <h2 id="distribution" className="mt-10 text-2xl font-bold tracking-tight">The distribution nobody shows on brochures</h2>
      <p className="leading-7 text-fg-soft">
        Over the same window: {above(12)} funds earned above 12%/yr, {above(9)} above 9%, {above(SANCH)} above the
        certificate&apos;s {SANCH.toFixed(1)}%, {above(INFL)} above inflation&apos;s ~{INFL.toFixed(1)}%. The rest — the
        majority — compounded *below* a savings instrument their marketing never mentions by name.
      </p>

      <div className="card card-pad mt-8">
        <h2 className="text-lg font-semibold">The honest buyer&apos;s checklist</h2>
        <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-7 text-fg-soft">
          <li>Certificate money is *sleep money*: safety of principal, fixed rate, guaranteed by the sovereign. Nothing else in this universe is that combination.</li>
          <li>Fund money is *growth money*: no promises, real drawdowns, and the only instrument class in this list with a shot at outrunning inflation long-term.</li>
          <li>If a fund can&apos;t beat the certificate across a 3-year window while charging a market fee, ask hard questions before letting it manage your appreciation.</li>
          <li>Taxes and eligibility differ per person (source tax bands, TIN status) — use net figures for your own case.</li>
        </ul>
        <div className="mt-4 flex flex-wrap gap-2">
          <Link href="/funds" className="btn-cta">Browse the funds →</Link>
          <Link href="/guides/mutual-fund-tax-bangladesh" className="btn-quiet">Tax rules behind these numbers →</Link>
        </div>
      </div>
    </div>
  );
}
