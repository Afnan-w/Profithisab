import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta, breadcrumbSchema } from "@/lib/seo";
import { JsonLd } from "@/components/seo/jsonld";
import { pctPlain, fullDate } from "@/lib/format";
import { HubNotice, PastPerformanceNote, Provenance } from "@/components/hub/provenance";
import { mergeManual, sourceById, type HubSourceStatus } from "@/lib/hub";

export const metadata: Metadata = pageMeta({
  title: "Other opportunities — FDR rates, Bangladesh Bank treasury, DSE & CSE indexes",
  description:
    "Bank FDR rates, Bangladesh Bank treasury bills & bonds, and DSE/CSE index levels — each with source name, data date, fetch time (Asia/Dhaka) and delay labels. Delayed and sample data are never presented as real-time. Information only, not investment advice.",
  path: "/hub/opportunities",
  keywords: ["FDR rate Bangladesh", "DSEX index today", "Bangladesh Bank treasury bill rate", "CSE index"],
});

function RateTable({ status, records }: { status: HubSourceStatus; records: ReturnType<typeof mergeManual> }) {
  return (
    <>
      {records.length ? (
        <div className="mt-4 overflow-x-auto rounded-xl">
          <table className="w-full min-w-[560px] border-separate border-spacing-0 text-sm">
            <thead>
              <tr>
                <th className="rounded-tl-xl border border-line bg-raised px-3 py-2.5 text-left font-semibold">Instrument</th>
                <th className="border border-line bg-raised px-3 py-2.5 text-right font-semibold">Value</th>
                <th className="border border-line bg-raised px-3 py-2.5 text-left font-semibold">Data date</th>
                <th className="rounded-tr-xl border border-line bg-raised px-3 py-2.5 text-left font-semibold">Label</th>
              </tr>
            </thead>
            <tbody className="tnum">
              {records.map((r, i) => (
                <tr key={`${r.label}-${i}`} className="border-b border-line">
                  <td className="border border-line px-3 py-2.5 font-medium">{r.label ?? "—"}</td>
                  <td className="border border-line px-3 py-2.5 text-right font-semibold">
                    {status.source.data_type === "index" ? r.value.toFixed(2) : pctPlain(r.value, 2)}
                  </td>
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
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="mt-4 rounded-xl border border-dashed border-line p-4 text-sm leading-relaxed text-muted">
          No figures published for this source yet — the placeholder ships with no invented numbers. Enable the source
          in <code className="text-xs">data/sources.json</code> and run the matching fetch script to populate it.
        </div>
      )}

      <Provenance
        sourceName={status.result?.source_name ?? status.source.name}
        sourceUrl={status.result?.source_url ?? status.source.url}
        dataDate={status.result?.data_date ?? null}
        fetchedAt={status.result?.fetched_at ?? null}
        delayMinutes={status.source.delay_minutes}
        sample={status.sample}
        stale={status.stale}
        manual={status.manual}
        note={status.result?.note ?? null}
      />
    </>
  );
}

function Section({
  id,
  title,
  intro,
  status,
}: {
  id: string;
  title: string;
  intro: string;
  status: HubSourceStatus | null;
}) {
  if (!status) return null;
  const records = status.result ? mergeManual(status.result) : [];
  return (
    <section id={id} className="mt-8">
      <div className="flex flex-wrap items-baseline gap-3">
        <h2 className="text-xl font-bold tracking-tight">{title}</h2>
        {status.sample ? (
          <span className="chip border-amber-300 text-amber-800 dark:border-amber-700 dark:text-amber-300">Sample data</span>
        ) : null}
        {status.delayLabel ? <span className="chip">{status.delayLabel}</span> : null}
        {status.manual ? <span className="chip">Manual updates</span> : null}
      </div>
      <p className="mt-1 max-w-3xl text-sm leading-relaxed text-muted">{intro}</p>
      <RateTable status={status} records={records} />
    </section>
  );
}

export default function HubOpportunitiesPage() {
  const fdr = sourceById("bank-fdr-rates");
  const bb = sourceById("bangladesh-bank-treasury");
  const dse = sourceById("dse-index");
  const cse = sourceById("cse-index");

  return (
    <div className="mx-auto max-w-6xl px-4 pt-10 sm:px-6">
      <JsonLd
        objects={[
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Data Hub", path: "/hub" },
            { name: "Opportunities", path: "/hub/opportunities" },
          ]),
        ]}
      />

      <nav aria-label="Breadcrumb" className="mb-3 text-xs text-muted">
        <Link href="/" className="hover:text-fg">Home</Link> →{" "}
        <Link href="/hub" className="hover:text-fg">Data Hub</Link> → <span className="text-fg">Opportunities</span>
      </nav>

      <header className="max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Other opportunities</h1>
        <p className="mt-3 text-muted">
          Bank deposits, government securities and market indexes, side by side — each with its own source line. Index
          levels are delayed closing/interim data and are never shown as real-time. Nothing here is a recommendation or
          a ranking.
        </p>
      </header>

      <div className="mt-6">
        <HubNotice />
      </div>

      <Section
        id="fdr"
        title="Bank fixed deposits (FDR)"
        intro="Indicative FDR rates. This source is manual: entries are typed from the bank's own published rate sheet and always labelled “manually updated on [date]”. Check the bank's current sheet before depositing."
        status={fdr}
      />

      <Section
        id="treasury"
        title="Bangladesh Bank — treasury bills & bonds"
        intro="Government treasury instrument yields published by Bangladesh Bank. There is no public REST API: this source is a strictly rate-limited HTML fetch of the official page, disabled by default, with clear Bangladesh Bank attribution."
        status={bb}
      />

      <Section
        id="dse"
        title="Dhaka Stock Exchange — DSEX / DSES"
        intro="Index levels from the Dhaka Stock Exchange. During trading hours these refresh every 15 minutes and carry a “delayed by up to 15 minutes” label; outside the window the last close stands. Never a real-time quote."
        status={dse}
      />

      <Section
        id="cse"
        title="Chittagong Stock Exchange — CSE index"
        intro="CSE index levels on the same 15-minute delayed schedule as DSE. The placeholder ships with no numbers until the source is enabled and validated."
        status={cse}
      />

      <section className="mt-10 card card-pad">
        <h2 className="text-lg font-semibold">How to read this page</h2>
        <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted">
          <li>Every table shows its source, data date and last fetch time (Asia/Dhaka) below it.</li>
          <li>“Sample data” means the figure ships with the repo so the page renders before the first fetch — not a live number.</li>
          <li>“manually updated on [date]” means a human entered it; it is never presented as real-time.</li>
          <li>“Data may be outdated” appears when a scheduled source has missed its expected refresh interval.</li>
          <li>No rankings or buy/sell suggestions appear anywhere on this hub.</li>
        </ul>
      </section>

      <div className="mt-6">
        <Link href="/hub/calculators" className="btn-cta text-sm">Model these with the calculators →</Link>
      </div>

      <PastPerformanceNote className="mt-6 pb-14" />
    </div>
  );
}
