import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta, breadcrumbSchema } from "@/lib/seo";
import { JsonLd } from "@/components/seo/jsonld";
import { pctPlain, fullDate } from "@/lib/format";
import { HubNotice, PastPerformanceNote, Provenance } from "@/components/hub/provenance";
import { mergeManual, sourceById } from "@/lib/hub";

export const metadata: Metadata = pageMeta({
  title: "Sonchayapatra & savings scheme rates — sourced, dated, labelled",
  description:
    "Savings-scheme (Sonchayapatra) interest rates with source name, data date and last fetch time in Asia/Dhaka. Manual entries are labelled “manually updated on [date]”. Sample data until the source is enabled. Information only, not investment advice.",
  path: "/hub/savings",
  keywords: ["Sanchayapatra rate Bangladesh", "savings certificate interest rate", "Sonchayapatra"],
});

export default function HubSavingsPage() {
  const status = sourceById("sonchayapatra-rates");
  const records = status?.result ? mergeManual(status.result) : [];

  return (
    <div className="mx-auto max-w-6xl px-4 pt-10 sm:px-6">
      <JsonLd
        objects={[
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Data Hub", path: "/hub" },
            { name: "Savings schemes", path: "/hub/savings" },
          ]),
        ]}
      />

      <nav aria-label="Breadcrumb" className="mb-3 text-xs text-muted">
        <Link href="/" className="hover:text-fg">Home</Link> →{" "}
        <Link href="/hub" className="hover:text-fg">Data Hub</Link> → <span className="text-fg">Savings schemes</span>
      </nav>

      <header className="max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Sonchayapatra &amp; savings schemes</h1>
        <p className="mt-3 text-muted">
          Published interest rates for Bangladesh savings schemes. Every rate carries its source, data date and fetch
          time; anything a human typed in is labelled “manually updated on [date]” and is never shown as real-time.
        </p>
      </header>

      <div className="mt-6">
        <HubNotice />
      </div>

      <section className="mt-6">
        <div className="flex flex-wrap items-baseline gap-3">
          <h2 className="text-xl font-bold tracking-tight">Current rates</h2>
          {status?.sample ? <span className="chip border-amber-300 text-amber-800 dark:border-amber-700 dark:text-amber-300">Sample data — not current published rates</span> : null}
        </div>

        {records.length ? (
          <div className="mt-4 overflow-x-auto rounded-xl">
            <table className="w-full min-w-[640px] border-separate border-spacing-0 text-sm">
              <thead>
                <tr>
                  <th className="rounded-tl-xl border border-line bg-raised px-3 py-2.5 text-left font-semibold">Scheme</th>
                  <th className="border border-line bg-raised px-3 py-2.5 text-right font-semibold">Annual rate</th>
                  <th className="border border-line bg-raised px-3 py-2.5 text-left font-semibold">Data date</th>
                  <th className="border border-line bg-raised px-3 py-2.5 text-left font-semibold">Label</th>
                  <th className="rounded-tr-xl border border-line bg-raised px-3 py-2.5 text-left font-semibold">Source</th>
                </tr>
              </thead>
              <tbody className="tnum">
                {records.map((r, i) => (
                  <tr key={`${r.label}-${i}`} className="border-b border-line">
                    <td className="border border-line px-3 py-2.5 font-medium">{r.label ?? "—"}</td>
                    <td className="border border-line px-3 py-2.5 text-right font-semibold">{pctPlain(r.value, 2)}</td>
                    <td className="border border-line px-3 py-2.5">{fullDate(r.data_date)}</td>
                    <td className="border border-line px-3 py-2.5">
                      {r.manual ? (
                        <span className="text-xs font-medium text-violet-700 dark:text-violet-300">
                          manually updated on {fullDate(r.data_date)}
                        </span>
                      ) : (
                        <span className="text-xs text-muted">fetched</span>
                      )}
                    </td>
                    <td className="border border-line px-3 py-2.5 text-xs text-muted">
                      {r.source_url ? (
                        <a href={r.source_url} target="_blank" rel="noopener noreferrer" className="underline decoration-dotted hover:text-fg">
                          {r.source_name} ↗
                        </a>
                      ) : (
                        r.source_name
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="mt-4 card card-pad">
            <p className="text-sm leading-relaxed text-muted">
              No savings-scheme rates are published yet. The source is a placeholder until it is enabled — we would
              rather show nothing than an unsourced number. Enable{" "}
              <code className="text-xs">sonchayapatra-rates</code> in{" "}
              <code className="text-xs">data/sources.json</code> and run{" "}
              <code className="text-xs">npm run fetch:rates</code>.
            </p>
          </div>
        )}

        <Provenance
          sourceName={status?.result?.source_name ?? status?.source.name ?? "Bangladesh Sanchayapatra / Savings Schemes"}
          sourceUrl={status?.result?.source_url ?? status?.source.url ?? null}
          dataDate={status?.result?.data_date ?? null}
          fetchedAt={status?.result?.fetched_at ?? null}
          delayMinutes={status?.source.delay_minutes ?? null}
          sample={status?.sample ?? false}
          stale={status?.stale ?? false}
          manual={status?.manual ?? false}
          note={status?.result?.note ?? null}
        />
      </section>

      {/* Tax + calculator */}
      <section className="mt-8 grid gap-4 lg:grid-cols-2">
        <div className="card card-pad">
          <h2 className="text-lg font-semibold">Tax on savings interest</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            Interest from savings schemes is generally subject to tax deducted at source ({" "}
            <strong className="text-fg tnum">10%</strong> used as the calculator default, per{" "}
            <code className="text-xs">config/tax.json</code> as of 11 Nov 2026 ). Certain small instruments may be
            exempt up to a threshold, and rates depend on your filer status. This is an estimate, not tax advice —
            confirm with NBR rules or a tax adviser.
          </p>
        </div>
        <div className="card card-pad">
          <h2 className="text-lg font-semibold">Model your own payout</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted">
            The Sonchayapatra calculator works out payout per period, total payouts, gross interest, estimated TDS and
            the cash you get back — or the compounded value if you reinvest.
          </p>
          <Link href="/hub/calculators" className="btn-cta mt-3 inline-block text-sm">
            Open calculators →
          </Link>
        </div>
      </section>

      <PastPerformanceNote className="mt-6 pb-14" />
    </div>
  );
}
