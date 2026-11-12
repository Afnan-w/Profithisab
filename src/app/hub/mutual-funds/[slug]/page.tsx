import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { pageMeta, breadcrumbSchema } from "@/lib/seo";
import { JsonLd } from "@/components/seo/jsonld";
import { getFund, metricsFor } from "@/lib/returns";
import { fullDate, pct, NOT_AVAILABLE } from "@/lib/format";
import { MultiLineChart } from "@/components/charts/line-chart";
import { Badge } from "@/components/ui/badge";
import { HubNotice, PastPerformanceNote, Provenance } from "@/components/hub/provenance";
import { loadNavHistory, monthlyNav, shariahStatusFor, sourceById } from "@/lib/hub";

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const fund = getFund(slug);
  if (!fund) return pageMeta({ title: "Fund NAV history — not found", description: "No such fund.", path: `/hub/mutual-funds/${slug}` });
  return pageMeta({
    title: `${fund.name} — NAV history & Shariah status source`,
    description: `Published NAV history for ${fund.name} (${fund.acronym}) with source, data date and fetch time in Asia/Dhaka, plus the source documenting its Shariah status — or "not confirmed" when no official source states it. Information only, not investment advice.`,
    path: `/hub/mutual-funds/${slug}`,
    keywords: [`${fund.name} NAV`, `${fund.acronym} NAV history`, "Bangladesh mutual fund NAV"],
  });
}

export default async function HubFundPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const fund = getFund(slug);
  if (!fund) notFound();

  const history = loadNavHistory(slug);
  const status = shariahStatusFor(slug);
  const navSource = sourceById("mutual-fund-nav");
  const m = metricsFor(slug);

  const monthly = history ? monthlyNav(history.points) : { labels: [], values: [] };
  const first = history?.points[0] ?? null;
  const last = history?.points[history.points.length - 1] ?? null;

  // NAV change over the hub window (simple first→last, stated as such).
  const changePct =
    first && last && first.nav > 0 ? ((last.nav - first.nav) / first.nav) * 100 : null;

  return (
    <div className="mx-auto max-w-6xl px-4 pt-10 sm:px-6">
      <JsonLd
        objects={[
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Data Hub", path: "/hub" },
            { name: "Mutual funds", path: "/hub/mutual-funds" },
            { name: fund.name, path: `/hub/mutual-funds/${fund.slug}` },
          ]),
        ]}
      />

      <nav aria-label="Breadcrumb" className="mb-3 text-xs text-muted">
        <Link href="/" className="hover:text-fg">Home</Link> →{" "}
        <Link href="/hub" className="hover:text-fg">Data Hub</Link> →{" "}
        <Link href="/hub/mutual-funds" className="hover:text-fg">Mutual funds</Link> →{" "}
        <span className="text-fg">{fund.name}</span>
      </nav>

      <header className="max-w-3xl">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{fund.name}</h1>
          <Badge tone="slate">{fund.acronym}</Badge>
        </div>
        <p className="mt-3 text-muted">
          {fund.amc} · {fund.type} fund · NAV history as published by the asset manager. This page shows the data
          itself — for return metrics and comparisons, see the fund&apos;s main page.
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <span className="chip">
            Latest NAV <strong className="text-fg tnum">{last ? `৳${last.nav.toFixed(2)}` : NOT_AVAILABLE}</strong>
            {last ? ` · ${fullDate(last.date)}` : ""}
          </span>
          <span className="chip"><strong className="text-fg tnum">{history?.points.length ?? 0}</strong> NAV points</span>
          {first ? <span className="chip">since {fullDate(first.date)}</span> : null}
          <span className="chip">
            window change{" "}
            <strong className="text-fg tnum">
              {changePct === null ? NOT_AVAILABLE : `${changePct >= 0 ? "+" : ""}${changePct.toFixed(1)}%`}
            </strong>
          </span>
        </div>
      </header>

      <div className="mt-6">
        <HubNotice />
      </div>

      {/* Shariah status — registry only, never inferred from the name */}
      <section className="mt-6 card card-pad">
        <h2 className="text-lg font-semibold">Shariah status</h2>
        {status ? (
          <>
            <p className="mt-2 flex flex-wrap items-center gap-2 text-sm">
              <Badge tone="brand">{status.status === "shariah-compliant" ? "Shariah-compliant" : status.status}</Badge>
              <span className="text-muted">documented by an official source, checked {fullDate(status.checked_on)}:</span>
            </p>
            <blockquote className="mt-3 border-l-2 border-brand-500 pl-3 text-sm italic leading-relaxed text-fg">
              “{status.quote}”
            </blockquote>
            <p className="mt-2 text-xs text-muted">
              Source:{" "}
              <a href={status.source_url} target="_blank" rel="noopener noreferrer" className="font-medium text-fg underline decoration-dotted hover:text-brand-700 dark:hover:text-brand-300">
                {status.source_name} ↗
              </a>
            </p>
          </>
        ) : (
          <p className="mt-2 text-sm leading-relaxed text-muted">
            <strong className="text-fg">Not confirmed.</strong> No official source we have checked states this
            fund&apos;s Shariah status, so we show it as unconfirmed. That is not the same as non-compliant — and we
            never guess from the fund&apos;s name. Check the fund&apos;s official prospectus or ask the asset manager.
          </p>
        )}
        <p className="mt-3 text-xs leading-relaxed text-faint">
          Registry: <code className="text-[11px]">data/shariah-status.json</code> — only source-documented entries are
          listed; a fund absent from it is always “not confirmed”.
        </p>
      </section>

      {/* NAV history chart */}
      <section className="mt-6 card card-pad">
        <h2 className="text-lg font-semibold">NAV history (month-end)</h2>
        {monthly.labels.length >= 2 ? (
          <div className="mt-3">
            <MultiLineChart
              title={`NAV per unit — ${fund.acronym}`}
              labels={monthly.labels}
              series={[{ name: "NAV (৳/unit)", values: monthly.values, color: "#0f766e", area: true }]}
              formatTick={(v) => `৳${v.toFixed(2)}`}
              note={`Month-end NAVs · latest ৳${(last?.nav ?? 0).toFixed(2)}${last ? ` (${fullDate(last.date)})` : ""}`}
            />
          </div>
        ) : (
          <p className="mt-2 text-sm text-muted">
            No NAV history file for this fund yet. Enable the mutual-fund NAV source and run{" "}
            <code className="text-xs">npm run fetch:nav</code> to populate it — nothing is drawn from guesswork.
          </p>
        )}

        <Provenance
          sourceName={history?.source_name ?? navSource?.source.name ?? "AMC-published NAV data (first-party)"}
          sourceUrl={history?.source_url ?? navSource?.source.url ?? null}
          dataDate={last?.date ?? null}
          fetchedAt={history?.fetched_at ?? navSource?.result?.fetched_at ?? null}
          delayMinutes={navSource?.source.delay_minutes ?? null}
          sample={history?.sample ?? navSource?.sample ?? false}
          stale={navSource?.stale ?? false}
          note={history?.note ?? null}
        />
      </section>

      {/* Full NAV table (first/last rows shown; full history in data file) */}
      <section className="mt-6">
        <h2 className="text-xl font-bold tracking-tight">Latest NAV points</h2>
        <p className="mt-1 text-sm text-muted">
          The five most recent published NAVs. The complete series lives in{" "}
          <code className="text-xs">data/nav-history/{fund.slug}.json</code> with its own source and fetch stamp.
        </p>
        {history && history.points.length ? (
          <div className="mt-4 overflow-x-auto rounded-xl">
            <table className="w-full min-w-[420px] border-separate border-spacing-0 text-sm">
              <thead>
                <tr>
                  <th className="rounded-tl-xl border border-line bg-raised px-3 py-2.5 text-left font-semibold">Date</th>
                  <th className="rounded-tr-xl border border-line bg-raised px-3 py-2.5 text-right font-semibold">NAV (৳)</th>
                </tr>
              </thead>
              <tbody className="tnum">
                {history.points.slice(-5).reverse().map((p) => (
                  <tr key={p.date} className="border-b border-line">
                    <td className="border border-line px-3 py-2.5">{fullDate(p.date)}</td>
                    <td className="border border-line px-3 py-2.5 text-right">{p.nav.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted">No NAV points published yet for this fund.</p>
        )}
      </section>

      {/* Main-page metrics link */}
      <section className="mt-6 card card-pad">
        <h2 className="text-lg font-semibold">Returns &amp; comparisons</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Growth of ৳1, SIP figures, worst falls and benchmark comparisons for this fund are computed on its main page
          from the same NAV history: {m.latestNavDate ? <span className="tnum">latest NAV ৳{m.latestNav.toFixed(2)} ({fullDate(m.latestNavDate)}).</span> : null}
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link href={`/funds/${fund.slug}`} className="btn-cta text-sm">Full fund page →</Link>
          <Link href={`/compare?funds=${fund.slug}`} className="btn-quiet text-sm">Compare this fund →</Link>
        </div>
      </section>

      <PastPerformanceNote className="mt-6 pb-14" />
    </div>
  );
}
