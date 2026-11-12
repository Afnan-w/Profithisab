import type { Metadata } from "next";
import Link from "next/link";
import fs from "node:fs";
import path from "node:path";
import { ALL_FUNDS, ATTRIBUTION, BENCHES, IS_DEMO, LICENSE, META, REVIEW, STATS, metricsFor } from "@/lib/returns";
import { pageMeta, breadcrumbSchema } from "@/lib/seo";
import { JsonLd } from "@/components/seo/jsonld";
import { fullDate, pct, NOT_AVAILABLE } from "@/lib/format";
import { QualityBadge } from "@/components/ui/badge";
import { DATA_DIR } from "@/lib/data";

interface RosterSnapshot {
  schemaVersion: number;
  asOf: string;
  fundCount: number;
  funds: Array<{ name: string; amc: string }>;
}

function loadRoster(): RosterSnapshot | null {
  try {
    return JSON.parse(fs.readFileSync(path.join(DATA_DIR, "market-roster.json"), "utf8")) as RosterSnapshot;
  } catch {
    return null;
  }
}

function normalize(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}

export const metadata: Metadata = pageMeta({
  title: "Data status — every fund, every gap",
  description:
    "The per-fund data status page: latest NAV date, row count, completeness, stale flags, source and review queue for every fund in this build. No figure is filled in when the data is missing.",
  path: "/data-status",
});

export default function DataStatusPage() {
  const stale = ALL_FUNDS.filter((f) => f.isStale);
  const withNav = ALL_FUNDS.filter((f) => f.nav.length > 0);
  const missing = ALL_FUNDS.filter((f) => f.nav.length === 0);

  return (
    <div className="mx-auto max-w-6xl px-4 pt-10 sm:px-6">
      <JsonLd
        objects={[
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Data status", path: "/data-status" },
          ]),
        ]}
      />

      <nav aria-label="Breadcrumb" className="mb-3 text-xs text-muted">
        <Link href="/" className="hover:text-fg">Home</Link> → <span className="text-fg">Data status</span>
      </nav>

      <header className="max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Data status</h1>
        <p className="mt-3 text-muted">
          Every fund in this build, its latest NAV date, its row count and whether it is complete. This page exists so
          you can judge the numbers before you trust them. A missing value is shown as missing, not back-filled.
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <span className="chip"><strong className="text-fg">{STATS.funds}</strong> funds</span>
          <span className="chip"><strong className="text-fg">{withNav.length}</strong> with NAV</span>
          <span className="chip"><strong className="text-fg">{STATS.complete}</strong> complete</span>
          <span className="chip"><strong className="text-fg">{STATS.partial}</strong> partial</span>
          <span className="chip"><strong className="text-fg">{STATS.stale}</strong> stale</span>
          <span className="chip"><strong className="text-fg">{REVIEW.length}</strong> in review queue</span>
        </div>
      </header>

      {IS_DEMO ? (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-7 text-amber-900 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-300">
          <strong>Demo dataset.</strong> The NAV histories below were generated for layout and arithmetic testing.
          They are not published fund data. The same page will show the real per-fund status after a licensed import.
        </div>
      ) : null}

      {/* Summary */}
      <section className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Summary label="Latest NAV" value={fullDate(META.latestNavDate)} sub={`last data file update ${fullDate(META.lastUpdated)}`} />
        <Summary label="Funds with NAV" value={`${withNav.length} / ${STATS.funds}`} sub={missing.length ? `${missing.length} missing entirely` : "none missing entirely"} />
        <Summary label="Stale funds" value={String(stale.length)} sub="no NAV in 30+ days; excluded from rankings" />
        <Summary label="Licensed verification records" value={String(STATS.verified)} sub="only shown when a named check and licence exist" />
      </section>

      {/* Fund universe (LankaBangla roster snapshot) */}
      {(() => {
        const roster = loadRoster();
        if (!roster || !roster.funds?.length) return null;
        const covered = new Set(ALL_FUNDS.map((f) => normalize(f.name)));
        const matched = roster.funds.filter((r) => covered.has(normalize(r.name))).length;
        return (
          <section className="mt-4">
            <div className="card card-pad !p-4 elev">
              <h2 className="text-lg font-semibold">Fund universe</h2>
              <p className="mt-2 leading-relaxed text-muted">
                Bangladesh has <strong className="text-fg">{roster.fundCount} open-end funds</strong> in the LankaBangla
                Financial Portal snapshot (as of {fullDate(roster.asOf)}). This site publishes returns for the{" "}
                <strong className="text-fg">{matched}</strong> whose asset manager publishes a machine-readable NAV
                history we can fetch. Coverage grows fund by fund; a fund absent from the tables is a fetch gap, not a
                judgement.
              </p>
            </div>
          </section>
        );
      })()}

      {/* Per-fund table */}
      <section className="mt-8">
        <h2 className="text-xl font-bold tracking-tight">Per-fund status</h2>
        <p className="mt-1 text-sm text-muted">
          Sorted by latest NAV date, then name. A stale fund is flagged even when its history is otherwise complete.
        </p>
        <div className="mt-4 overflow-x-auto rounded-xl">
          <table className="w-full min-w-[820px] border-separate border-spacing-0 text-sm">
            <thead>
              <tr>
                <th className="rounded-tl-xl border border-line bg-raised px-3 py-2.5 text-left font-semibold">Fund</th>
                <th className="border border-line bg-raised px-3 py-2.5 text-left font-semibold">Type</th>
                <th className="border border-line bg-raised px-3 py-2.5 text-left font-semibold">Latest NAV</th>
                <th className="border border-line bg-raised px-3 py-2.5 text-right font-semibold">NAV rows</th>
                <th className="border border-line bg-raised px-3 py-2.5 text-left font-semibold">Quality</th>
                <th className="border border-line bg-raised px-3 py-2.5 text-right font-semibold">3-yr / yr</th>
                <th className="border border-line bg-raised px-3 py-2.5 text-left font-semibold">Source</th>
              </tr>
            </thead>
            <tbody className="tnum">
              {[...ALL_FUNDS]
                .sort((a, b) => {
                  const da = a.latestNavDate ?? "";
                  const db = b.latestNavDate ?? "";
                  if (da !== db) return db.localeCompare(da);
                  return a.name.localeCompare(b.name);
                })
                .map((f) => {
                  const m = metricsFor(f.slug);
                  return (
                    <tr key={f.slug} id={f.slug} className="scroll-mt-20 border-b border-line">
                      <td className="border border-line px-3 py-2.5">
                        <Link href={`/funds/${f.slug}`} className="font-medium hover:text-brand-700 dark:hover:text-brand-300 transition-colors">
                          {f.name}
                        </Link>
                        <span className="ml-1.5 text-[10px] text-faint">{f.acronym}</span>
                      </td>
                      <td className="border border-line px-3 py-2.5 capitalize">{f.type}{f.shariah ? " · Shariah" : ""}</td>
                      <td className="border border-line px-3 py-2.5">{fullDate(f.latestNavDate)}</td>
                      <td className="border border-line px-3 py-2.5 text-right">{f.nav.length}</td>
                      <td className="border border-line px-3 py-2.5"><QualityBadge completeness={f.completeness} stale={f.isStale} /></td>
                      <td className="border border-line px-3 py-2.5 text-right font-semibold">{m.g3 === null ? NOT_AVAILABLE : pct(m.g3)}</td>
                      <td className="border border-line px-3 py-2.5 text-xs text-muted">
                        {f.source.url ? (
                          <a href={f.source.url} target="_blank" rel="noopener noreferrer" className="underline decoration-dotted hover:text-fg">
                            {f.source.name} ↗
                          </a>
                        ) : (
                          f.source.name
                        )}
                      </td>
                    </tr>
                  );
                })}
            </tbody>
          </table>
        </div>
        {stale.length ? (
          <p className="mt-3 text-xs leading-relaxed text-faint">
            <strong className="text-muted">Stale:</strong> {stale.map((f) => f.name).join(", ")}. Their last NAV is more
            than 30 days old, so they are excluded from every ranking even if their return arithmetic would otherwise be
            computable.
          </p>
        ) : (
          <p className="mt-3 text-xs text-faint">No fund is stale in this build.</p>
        )}
        {missing.length ? (
          <p className="mt-2 text-xs leading-relaxed text-faint">
            <strong className="text-muted">No NAV file:</strong> {missing.map((f) => f.name).join(", ")}. These funds
            show “Data not available” rather than a guess.
          </p>
        ) : null}
      </section>

      {/* Licence + attribution */}
      <section className="mt-10 grid gap-4 lg:grid-cols-2">
        <div className="card card-pad elev">
          <h2 className="text-lg font-semibold">Permission &amp; attribution</h2>
          <dl className="mt-3 grid gap-2 text-sm">
            <Row k="Source name" v={LICENSE.sourceName || NOT_AVAILABLE} />
            <Row k="Permission date" v={LICENSE.permissionDate || NOT_AVAILABLE} />
            <Row k="Permitted uses" v={LICENSE.permitted.length ? LICENSE.permitted.join(", ") : NOT_AVAILABLE} />
            <Row k="Automated fetching" v={LICENSE.automatedFetching ? "Permitted" : "Not permitted"} />
            <Row k="Attribution text" v={ATTRIBUTION?.text || LICENSE.attributionText || NOT_AVAILABLE} />
            <Row
              k="Source link"
              v={
                LICENSE.sourceUrl ? (
                  <a href={LICENSE.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline decoration-dotted">
                    Open source ↗
                  </a>
                ) : (
                  NOT_AVAILABLE
                )
              }
            />
          </dl>
          <p className="mt-3 text-xs leading-relaxed text-faint">
            No figure is published unless <code>data/license.json</code> records the source policy, the permitted uses
            and the exact attribution wording. This is enforced by the build check, not by a promise. The full source
            list — URLs, politeness rules and what each source provides — lives in <code>data/sources.json</code>.
          </p>
        </div>

        <div className="card card-pad elev">
          <h2 className="text-lg font-semibold">Review queue</h2>
          {REVIEW.length ? (
            <>
              <p className="mt-1 text-sm text-muted">
                {REVIEW.length} row{REVIEW.length === 1 ? "" : "s"} are held back from publication until a human checks
                them.
              </p>
              <details className="mt-3 rounded-xl border border-line p-3">
                <summary className="cursor-pointer text-sm font-medium">Show the reasons</summary>
                <ul className="mt-2 space-y-2 text-xs leading-relaxed text-muted">
                  {REVIEW.slice(0, 100).map((item, i) => (
                    <li key={`${item.file}-${item.row}-${i}`}>
                      <strong className="text-fg">{item.file}</strong> row {item.row}: {item.reason}
                    </li>
                  ))}
                </ul>
                {REVIEW.length > 100 ? <p className="mt-2 text-xs text-faint">…and {REVIEW.length - 100} more.</p> : null}
              </details>
            </>
          ) : (
            <p className="mt-2 text-sm text-muted">
              Empty. Suspicious NAV jumps, unreadable dates and dividends far from any NAV date land here instead of
              the live tables.
            </p>
          )}
          <p className="mt-3 text-xs leading-relaxed text-faint">
            Approve a held row with <code>npm run data:approve</code> only after checking the source. The command records
            an approved deviation, so the check can distinguish a verified jump from an error.
          </p>
        </div>
      </section>

      {/* Benchmarks */}
      <section className="mt-10">
        <h2 className="text-xl font-bold tracking-tight">Benchmarks</h2>
        <p className="mt-1 text-sm text-muted">
          Benchmarks have their own status labels. “Approximate” means a working average without an official citation;
          “unavailable” means no line is drawn.
        </p>
        <div className="mt-4 overflow-x-auto rounded-xl">
          <table className="w-full min-w-[680px] border-separate border-spacing-0 text-sm">
            <thead>
              <tr>
                <th className="rounded-tl-xl border border-line bg-raised px-3 py-2.5 text-left font-semibold">Benchmark</th>
                <th className="border border-line bg-raised px-3 py-2.5 text-right font-semibold">Rate</th>
                <th className="border border-line bg-raised px-3 py-2.5 text-left font-semibold">Status</th>
                <th className="border border-line bg-raised px-3 py-2.5 text-left font-semibold">Source</th>
                <th className="border border-line bg-raised px-3 py-2.5 text-left font-semibold">Note</th>
              </tr>
            </thead>
            <tbody>
              {BENCHES.map((b) => (
                <tr key={b.slug} className="border-b border-line">
                  <td className="border border-line px-3 py-2.5 font-medium">{b.name}</td>
                  <td className="border border-line px-3 py-2.5 text-right tnum">{b.annualRate === null ? NOT_AVAILABLE : `${b.annualRate.toFixed(2)}%/yr`}</td>
                  <td className="border border-line px-3 py-2.5">{b.status}</td>
                  <td className="border border-line px-3 py-2.5 text-xs text-muted">
                    {b.source.url ? (
                      <a href={b.source.url} target="_blank" rel="noopener noreferrer" className="underline decoration-dotted hover:text-fg">
                        {b.source.name} ↗
                      </a>
                    ) : (
                      b.source.name
                    )}
                  </td>
                  <td className="border border-line px-3 py-2.5 text-xs text-muted">{b.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <p className="mt-12 pb-16 text-xs text-faint">
        Method and formulas: <Link href="/methodology" className="underline decoration-dotted hover:text-fg">methodology</Link>.{" "}
        {IS_DEMO ? "This build is demo data. " : "This build is served from imported data files. "}
        Nothing here is investment advice.
      </p>
    </div>
  );
}

function Summary({ label, value, sub }: { label: string; value: string; sub: string }) {
  return (
    <div className="card card-pad !p-4 elev">
      <p className="text-[11px] font-medium uppercase tracking-wide text-muted">{label}</p>
      <p className="mt-1 text-xl font-bold tnum">{value}</p>
      <p className="text-[11px] text-faint">{sub}</p>
    </div>
  );
}

function Row({ k, v }: { k: string; v: React.ReactNode }) {
  return (
    <div className="flex flex-wrap justify-between gap-2 border-b border-line pb-2">
      <dt className="text-muted">{k}</dt>
      <dd className="max-w-[62%] text-right font-medium">{v}</dd>
    </div>
  );
}
