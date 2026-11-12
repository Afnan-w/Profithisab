import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta, breadcrumbSchema, itemListSchema } from "@/lib/seo";
import { JsonLd } from "@/components/seo/jsonld";
import { ALL_FUNDS, STATS } from "@/lib/returns";
import { fullDate } from "@/lib/format";
import { HubFundControls } from "@/components/hub/fund-controls";
import { HubNotice, PastPerformanceNote, Provenance } from "@/components/hub/provenance";
import { loadNavHistory, shariahRegistry, shariahStatusFor, sourceById } from "@/lib/hub";

export const metadata: Metadata = pageMeta({
  title: "Mutual fund NAV data — searchable directory with Shariah status sources",
  description: `Every open-end fund in this build with its latest NAV date, NAV history page and source-documented Shariah status. Status is shown only when an official source states it; anything else is "not confirmed". ${STATS.funds} funds. Information only, not investment advice.`,
  path: "/hub/mutual-funds",
  keywords: ["mutual fund NAV Bangladesh", "Shariah mutual fund Bangladesh", "fund NAV history"],
});

export default function HubFundsPage() {
  const registry = shariahRegistry();
  const navSource = sourceById("mutual-fund-nav");

  const rows = ALL_FUNDS.map((f) => {
    const status = shariahStatusFor(f.slug);
    const history = loadNavHistory(f.slug);
    return {
      slug: f.slug,
      name: f.name,
      acronym: f.acronym,
      amc: f.amc,
      type: f.type,
      shariah: status ? (status.status === "shariah-compliant" ? "confirmed" : "not-confirmed") : "not-confirmed",
      statusSource: status,
      latestDate: history?.points.length ? history.points[history.points.length - 1].date : f.latestNavDate,
      points: history?.points.length ?? 0,
      historySample: history?.sample ?? false,
    };
  }).sort((a, b) => a.name.localeCompare(b.name));

  const confirmed = rows.filter((r) => r.shariah === "confirmed").length;

  return (
    <div className="mx-auto max-w-6xl px-4 pt-10 sm:px-6">
      <JsonLd
        objects={[
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Data Hub", path: "/hub" },
            { name: "Mutual funds", path: "/hub/mutual-funds" },
          ]),
          itemListSchema(
            rows.map((r) => `/hub/mutual-funds/${r.slug}`),
            rows.map((r) => r.name)
          ),
        ]}
      />

      <nav aria-label="Breadcrumb" className="mb-3 text-xs text-muted">
        <Link href="/" className="hover:text-fg">Home</Link> →{" "}
        <Link href="/hub" className="hover:text-fg">Data Hub</Link> → <span className="text-fg">Mutual funds</span>
      </nav>

      <header className="max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Mutual fund NAV data</h1>
        <p className="mt-3 text-muted">
          Search {rows.length} funds by name, manager or acronym. Each fund links to a per-fund NAV history page with
          its source, data date and fetch time. Shariah status appears only where an official source states it.
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <span className="chip"><strong className="text-fg">{rows.length}</strong> funds</span>
          <span className="chip"><strong className="text-fg">{rows.filter((r) => r.points > 0).length}</strong> with hub NAV history</span>
          <span className="chip"><strong className="text-fg">{confirmed}</strong> Shariah confirmed by source</span>
          <span className="chip"><strong className="text-fg">{rows.length - confirmed}</strong> not confirmed</span>
        </div>
      </header>

      <div className="mt-6">
        <HubNotice />
      </div>

      <section className="mt-6">
        <HubFundControls total={rows.length} />
      </section>

      <section className="mt-4 overflow-x-auto rounded-xl">
        <table id="hub-fund-table" className="w-full min-w-[860px] border-separate border-spacing-0 text-sm">
          <caption className="sr-only">Funds with latest NAV date and Shariah status source</caption>
          <thead>
            <tr>
              <th className="rounded-tl-xl border border-line bg-raised px-3 py-2.5 text-left font-semibold">Fund</th>
              <th className="border border-line bg-raised px-3 py-2.5 text-left font-semibold">Manager</th>
              <th className="border border-line bg-raised px-3 py-2.5 text-left font-semibold">Type</th>
              <th className="border border-line bg-raised px-3 py-2.5 text-left font-semibold">Shariah status</th>
              <th className="border border-line bg-raised px-3 py-2.5 text-left font-semibold">Latest NAV</th>
              <th className="border border-line bg-raised px-3 py-2.5 text-right font-semibold">NAV points</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.slug}
                data-fund-name={r.name}
                data-fund-amc={r.amc}
                data-fund-acronym={r.acronym}
                data-fund-type={r.type}
                data-fund-shariah={r.shariah}
                className="border-b border-line"
              >
                <td className="border border-line px-3 py-2.5">
                  <Link href={`/hub/mutual-funds/${r.slug}`} className="font-medium hover:text-brand-700 dark:hover:text-brand-300">
                    {r.name}
                  </Link>
                  <span className="ml-1.5 text-[10px] text-faint">{r.acronym}</span>
                </td>
                <td className="border border-line px-3 py-2.5 text-xs text-muted">{r.amc}</td>
                <td className="border border-line px-3 py-2.5 capitalize">{r.type}</td>
                <td className="border border-line px-3 py-2.5">
                  {r.statusSource ? (
                    <a
                      href={r.statusSource.source_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-medium text-brand-700 underline decoration-dotted dark:text-brand-300"
                      title={`“${r.statusSource.quote}” — ${r.statusSource.source_name}`}
                    >
                      Confirmed by source ↗
                    </a>
                  ) : (
                    <span className="text-xs text-muted">Not confirmed</span>
                  )}
                </td>
                <td className="border border-line px-3 py-2.5 tnum">{fullDate(r.latestDate)}</td>
                <td className="border border-line px-3 py-2.5 text-right tnum">
                  {r.points ? r.points : <span className="text-faint">—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <Provenance
        sourceName={navSource?.result?.source_name ?? navSource?.source.name ?? "AMC-published NAV data (first-party)"}
        sourceUrl={navSource?.result?.source_url ?? navSource?.source.url ?? null}
        dataDate={navSource?.result?.data_date ?? null}
        fetchedAt={navSource?.result?.fetched_at ?? null}
        delayMinutes={navSource?.source.delay_minutes ?? null}
        sample={navSource?.sample ?? true}
        stale={navSource?.stale ?? false}
        note={
          navSource?.result?.note ??
          "Per-fund NAV history files ship with the repo as sample data until the NAV source is enabled and the first fetch runs."
        }
      />

      <PastPerformanceNote className="mt-4 pb-14" />
    </div>
  );
}
