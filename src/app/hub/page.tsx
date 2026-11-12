import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta, breadcrumbSchema } from "@/lib/seo";
import { JsonLd } from "@/components/seo/jsonld";
import { allSourceStatuses, hubSources } from "@/lib/hub";
import { Provenance, HubNotice } from "@/components/hub/provenance";
import { dhakaDate } from "@/lib/hub/freshness";

export const metadata: Metadata = pageMeta({
  title: "Investment Data Hub — NAV, savings rates, market indexes & calculators",
  description:
    "Searchable mutual-fund NAV data with source-documented Shariah status, Sonchayapatra and FDR rates, DSE/CSE indexes and Bangladesh Bank treasury data — every figure stamped with its source, data date and fetch time. Information only, not investment advice.",
  path: "/hub",
  keywords: [
    "Bangladesh investment data",
    "mutual fund NAV Bangladesh",
    "Sanchayapatra rate",
    "FDR rate Bangladesh",
    "DSEX index",
    "SIP calculator Bangladesh",
  ],
});

const SECTIONS = [
  {
    href: "/hub/mutual-funds",
    title: "Mutual funds",
    body: "Every fund in this build with its latest NAV and a per-fund NAV history page. Shariah status is shown only when an official source states it — never inferred from a name.",
  },
  {
    href: "/hub/savings",
    title: "Savings schemes",
    body: "Sonchayapatra / savings-scheme interest rates with source, data date and manual-update labels.",
  },
  {
    href: "/hub/opportunities",
    title: "Other opportunities",
    body: "Bank FDR rates, Bangladesh Bank treasury bills & bonds, and DSE / CSE index levels — delayed, sourced and never presented as real-time.",
  },
  {
    href: "/hub/calculators",
    title: "Calculators",
    body: "SIP, lump sum, FDR and Sonchayapatra calculators. Estimates only, with the tax assumptions shown.",
  },
];

export default function HubPage() {
  const statuses = allSourceStatuses();
  const enabled = hubSources().filter((s) => s.enabled).length;

  return (
    <div className="mx-auto max-w-6xl px-4 pt-10 sm:px-6">
      <JsonLd
        objects={[
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Data Hub", path: "/hub" },
          ]),
        ]}
      />

      <nav aria-label="Breadcrumb" className="mb-3 text-xs text-muted">
        <Link href="/" className="hover:text-fg">Home</Link> → <span className="text-fg">Data Hub</span>
      </nav>

      <header className="max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Investment Data Hub</h1>
        <p className="mt-3 text-muted">
          Mutual-fund NAV history, savings-scheme rates, bank deposits, market indexes and calculators — each figure
          stamped with its source name, data date and last fetch time (Asia/Dhaka). Delayed data is labelled delayed;
          manual data is labelled manual; nothing here is presented as real-time.
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <span className="chip"><strong className="text-fg">{hubSources().length}</strong> registered sources</span>
          <span className="chip"><strong className="text-fg">{enabled}</strong> enabled</span>
          <span className="chip">
            <strong className="text-fg">{statuses.filter((s) => s.sample).length}</strong> shipping sample data
          </span>
        </div>
      </header>

      <div className="mt-6">
        <HubNotice />
      </div>

      {/* Sections */}
      <section className="mt-8 grid gap-4 sm:grid-cols-2">
        {SECTIONS.map((s) => (
          <Link key={s.href} href={s.href} className="card card-pad group block transition hover:border-brand-500">
            <h2 className="text-lg font-semibold group-hover:text-brand-700 dark:group-hover:text-brand-300">{s.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">{s.body}</p>
            <span className="mt-3 inline-block text-sm font-medium text-brand-700 dark:text-brand-300">Open →</span>
          </Link>
        ))}
      </section>

      {/* Source status */}
      <section className="mt-10">
        <h2 className="text-xl font-bold tracking-tight">Sources &amp; freshness</h2>
        <p className="mt-1 text-sm text-muted">
          Every source in <code className="text-xs">data/sources.json</code>. Sources start disabled; a source is only
          enabled after confirming it is public, does not require login, permits automated access and is not a paid
          licence. A source with no result file publishes no figure — we never invent one.
        </p>
        <div className="mt-4 overflow-x-auto rounded-xl">
          <table className="w-full min-w-[860px] border-separate border-spacing-0 text-sm">
            <thead>
              <tr>
                <th className="rounded-tl-xl border border-line bg-raised px-3 py-2.5 text-left font-semibold">Source</th>
                <th className="border border-line bg-raised px-3 py-2.5 text-left font-semibold">Type</th>
                <th className="border border-line bg-raised px-3 py-2.5 text-left font-semibold">Schedule</th>
                <th className="border border-line bg-raised px-3 py-2.5 text-left font-semibold">Status</th>
                <th className="border border-line bg-raised px-3 py-2.5 text-left font-semibold">Data date</th>
                <th className="border border-line bg-raised px-3 py-2.5 text-left font-semibold">Flags</th>
              </tr>
            </thead>
            <tbody>
              {statuses.map((s) => (
                <tr key={s.source.id} className="border-b border-line align-top">
                  <td className="border border-line px-3 py-2.5">
                    <span className="font-medium">{s.source.name}</span>
                    {s.result?.source_url || s.source.url ? (
                      <a
                        href={s.result?.source_url ?? s.source.url ?? "#"}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="ml-1.5 text-xs text-muted underline decoration-dotted hover:text-fg"
                      >
                        ↗
                      </a>
                    ) : null}
                  </td>
                  <td className="border border-line px-3 py-2.5 text-xs">{s.source.type}</td>
                  <td className="border border-line px-3 py-2.5 text-xs text-muted">{s.source.schedule ?? "—"}</td>
                  <td className="border border-line px-3 py-2.5 text-xs">
                    {s.source.enabled ? (
                      <span className="font-medium text-fg">Enabled</span>
                    ) : (
                      <span className="text-muted">Disabled (placeholder)</span>
                    )}
                  </td>
                  <td className="border border-line px-3 py-2.5 text-xs tnum">
                    {s.result ? dhakaDate(s.result.data_date) ?? "—" : "no data yet"}
                  </td>
                  <td className="border border-line px-3 py-2.5">
                    <div className="flex flex-wrap gap-1.5">
                      {s.sample ? <span className="chip !text-[10px]">sample</span> : null}
                      {s.stale ? <span className="chip !text-[10px] border-amber-300 text-amber-800 dark:border-amber-700 dark:text-amber-300">may be outdated</span> : null}
                      {s.delayLabel ? <span className="chip !text-[10px]">{s.delayLabel}</span> : null}
                      {s.manual ? <span className="chip !text-[10px]">manual</span> : null}
                      {!s.sample && !s.stale && !s.delayLabel && !s.manual ? <span className="text-xs text-faint">—</span> : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <Provenance
          sourceName="Profithisab source registry (data/sources.json)"
          dataDate={null}
          fetchedAt={null}
          note="Each data table and chart on this hub carries its own provenance line with source, data date and last fetch time. Sample data ships with the repo so pages render before the first scheduled fetch; it is badged “Sample data” everywhere it appears."
        />
      </section>

      <p className="mt-10 pb-14 text-xs text-faint">
        Information only. Not investment advice. Check the fund&apos;s official prospectus before investing. Past
        performance does not guarantee future results.
      </p>
    </div>
  );
}
