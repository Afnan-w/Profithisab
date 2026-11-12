import type { Metadata } from "next";
import Link from "next/link";
import { ALL_FUNDS, BENCHES, getFund, metricsFor } from "@/lib/returns";
import { CompareTable, type CompareFund } from "@/components/compare/compare-table";
import { CopyButton } from "@/components/ui/copy-button";
import { fullDate } from "@/lib/format";
import { site } from "@/lib/site";
import { pageMeta, breadcrumbSchema } from "@/lib/seo";
import { JsonLd } from "@/components/seo/jsonld";

export const metadata: Metadata = pageMeta({
  title: "Compare Bangladeshi mutual funds side by side",
  description:
    "Two to four Bangladeshi open-end funds on one sortable table: 1/3/5-year total returns, the ৳5,000/month SIP replay, fees, size, worst fall and data completeness. Built from the committed NAV history — with missing values shown as missing.",
  path: "/compare",
  keywords: ["compare mutual funds bangladesh", "mutual fund comparison table BD", "SIP comparison Bangladesh"],
});

type SP = Record<string, string | string[] | undefined>;

function resolveSelection(sp: SP): string[] {
  const rawArr = Array.isArray(sp.funds) ? sp.funds : typeof sp.funds === "string" ? [sp.funds] : [];
  const slugs = rawArr
    .flatMap((v) => v.split(","))
    .map((s) => s.trim())
    .filter((s) => getFund(s))
    .filter((s, i, a) => a.indexOf(s) === i);
  if (slugs.length >= 4) return slugs.slice(0, 4);
  if (slugs.length >= 2) return slugs;
  if (slugs.length === 1) {
    const fallback = ALL_FUNDS.find((f) => f.slug !== slugs[0])?.slug;
    return fallback ? [slugs[0], fallback] : slugs;
  }
  return ALL_FUNDS.slice(0, 3).map((f) => f.slug);
}

export default async function ComparePage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const slugs = resolveSelection(sp);
  const funds = slugs.map((s) => getFund(s)!).filter(Boolean);
  const sanch = BENCHES.find((b) => b.slug === "sanchayapatra") ?? null;

  const rows: CompareFund[] = funds.map((f) => {
    const m = metricsFor(f.slug);
    return {
      slug: f.slug,
      name: f.name,
      acronym: f.acronym,
      amc: f.amc,
      type: f.type,
      shariah: f.shariah,
      completeness: f.completeness,
      isStale: f.isStale,
      latestNav: m.latestNav || null,
      latestNavDate: f.latestNavDate,
      fundSize: f.fundSize,
      fee: f.fee,
      g1: m.g1,
      g3: m.g3,
      g5: m.g5,
      gMax: m.gMax,
      sipIrr3: m.sip.irr3,
      sipFinal3: m.sip.final3,
      sipInvested3: m.sip.invested3,
      worstFall: m.worstFall,
      vol: m.vol,
      positiveMonths3y: m.positiveMonths3y,
      divPaid3y: m.divPaid3y,
      became3y: m.g3 === null ? null : 100000 * Math.pow(1 + m.g3, 3),
    };
  });

  const latest = rows.map((r) => r.latestNavDate).filter((d): d is string => Boolean(d)).sort().at(-1) ?? null;

  return (
    <div className="mx-auto max-w-6xl px-4 pt-8 sm:px-6">
      <JsonLd
        objects={[
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Compare", path: "/compare" },
          ]),
        ]}
      />

      <nav aria-label="Breadcrumb" className="mb-3 text-xs text-muted">
        <Link href="/" className="hover:text-fg">Home</Link> → <span className="text-fg">Compare</span>
      </nav>

      <header className="max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Compare Bangladeshi mutual funds, side by side</h1>
        <p className="mt-3 text-muted">
          Two to four funds, one sortable table, the same windows. The link to this page carries your exact selection —
          copy it and your friend sees precisely what you see.
        </p>
      </header>

      <div className="card card-pad mt-6 elev">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <form action="/compare" method="get" className="flex flex-wrap items-end gap-2">
            {[0, 1, 2, 3].map((i) => (
              <label key={i} className="text-[11px] font-medium text-muted">
                Fund {i + 1}
                <select
                  name="funds"
                  defaultValue={slugs[i] ?? ""}
                  className="mt-1 block max-w-[13rem] rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs"
                  aria-label={`Fund ${i + 1}`}
                >
                  <option value="">None</option>
                  {ALL_FUNDS.map((f) => (
                    <option key={f.slug} value={f.slug}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </label>
            ))}
            <button type="submit" className="btn-cta !px-3 !py-1.5 text-xs">Update comparison</button>
          </form>
          <div className="flex flex-wrap items-center gap-2">
            <span className="hidden text-xs text-faint sm:block">
              One-time figures assume ৳1,00,000; SIP replays ৳5,000 monthly · dividends reinvested
            </span>
            <CopyButton text={`${site.url}/compare?funds=${slugs.join(",")}`} label="Copy this comparison" />
          </div>
        </div>
      </div>

      <div className="mt-6">
        <CompareTable
          funds={rows}
          benchmark={
            sanch
              ? { short: sanch.short, annualRate: sanch.annualRate, status: sanch.status }
              : null
          }
        />
      </div>

      <p className="mt-4 text-xs leading-relaxed text-faint">
        One-time figures compound the fixed 3-year window ending {fullDate(latest)}; the SIP row buys ৳5,000 at each
        month-end NAV across the same 36 months. Dividends are reinvested in every line. A dash or “Data not available”
        means the committed data does not contain the value — it is never filled with a guess. Stale funds are marked and
        excluded from rankings, but you can still inspect them here.
        {funds.length < 4 ? " Slot open — add another fund above." : ""}
      </p>

      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        <Link href="/funds" className="card transition hover:border-brand-500 group">
          <div className="card-pad !p-4 sm:!p-5">
            <h2 className="font-semibold group-hover:text-brand-700 dark:group-hover:text-brand-400 transition-colors">Browse all {ALL_FUNDS.length} funds</h2>
            <p className="mt-1 text-sm text-muted">Growth, balanced, income and Shariah — with quality flags.</p>
          </div>
        </Link>
        <Link href="/guides/best-mutual-funds-bangladesh" className="card transition hover:border-brand-500 group">
          <div className="card-pad !p-4 sm:!p-5">
            <h2 className="font-semibold group-hover:text-brand-700 dark:group-hover:text-brand-400 transition-colors">Leaderboard</h2>
            <p className="mt-1 text-sm text-muted">The roster ranked by one transparent number.</p>
          </div>
        </Link>
        <Link href="/guides/sanchayapatra-vs-mutual-funds" className="card transition hover:border-brand-500 group">
          <div className="card-pad !p-4 sm:!p-5">
            <h2 className="font-semibold group-hover:text-brand-700 dark:group-hover:text-brand-400 transition-colors">Sanchayapatra vs mutual funds</h2>
            <p className="mt-1 text-sm text-muted">Certificates vs units — decided by the numbers, not by ads.</p>
          </div>
        </Link>
      </section>

      <p className="mt-10 pb-16 text-xs text-faint">
        Figures rebuilt from the committed NAV history, latest fund date {fullDate(latest)}. Benchmarks are labelled
        approximate where they are not officially cited. For research — not investment advice.
      </p>
    </div>
  );
}
