import type { Metadata } from "next";
import Link from "next/link";
import { ALL_FUNDS, AMC_LIST, META, STATS, fundGroups, metricsFor } from "@/lib/returns";
import { FundCard } from "@/components/funds/fund-card";
import { DirectoryControls } from "@/components/funds/directory-controls";
import { pageMeta, itemListSchema, breadcrumbSchema } from "@/lib/seo";
import { JsonLd } from "@/components/seo/jsonld";
import { fullDate } from "@/lib/format";

export const metadata: Metadata = pageMeta({
  title: "Bangladeshi open-end mutual funds — tracked NAV history",
  description: `The ${STATS.funds} open-end funds in this Profithisab build — growth, balanced, income and Shariah — with 1/3/5-year and since-launch figures, fees, worst falls, latest NAV dates and data-completeness flags. Latest NAV ${fullDate(META.latestNavDate)}.`,
  path: "/funds",
  keywords: [
    "open end mutual fund Bangladesh",
    "Bangladesh mutual fund list",
    "mutual fund NAV Bangladesh",
    "Shariah mutual fund Bangladesh",
  ],
});

export default function FundsPage() {
  const groups = fundGroups();
  const GROUPS: Array<{ id: string; title: string; blurb: string; funds: typeof ALL_FUNDS }> = [
    {
      id: "growth",
      title: "Growth funds",
      blurb: "Equity-first portfolios. Higher potential swings, higher risk.",
      funds: groups.growth,
    },
    {
      id: "balanced",
      title: "Balanced funds",
      blurb: "Part equity, part fixed income. Smoother than growth funds.",
      funds: groups.balanced,
    },
    {
      id: "income",
      title: "Income funds",
      blurb: "Fixed-income portfolios. The question is what the manager charges.",
      funds: groups.income,
    },
    {
      id: "shariah",
      title: "Shariah-compliant funds",
      blurb: "Shariah-screened portfolios. They also appear under their own category above.",
      funds: groups.shariah,
    },
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 pt-10 sm:px-6">
      <JsonLd
        objects={[
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Funds", path: "/funds" },
          ]),
          itemListSchema(
            ALL_FUNDS.map((f) => `/funds/${f.slug}`),
            ALL_FUNDS.map((f) => f.name)
          ),
        ]}
      />

      <nav aria-label="Breadcrumb" className="mb-3 text-xs text-muted">
        <Link href="/" className="hover:text-fg">Home</Link> <span aria-hidden="true">/</span>{" "}
        <span className="text-fg">Funds</span>
      </nav>

      <header className="max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Bangladeshi open-end mutual funds</h1>
        <p className="mt-3 text-muted">
          This build contains {STATS.funds} funds from {STATS.amcs} asset managers. It is the roster whose NAV and
          dividend history is present in our data files — not a claim to have every fund in Bangladesh.
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <span className="chip"><strong className="text-fg">{STATS.withNav}</strong> with NAV history</span>
          <span className="chip"><strong className="text-fg">{STATS.complete}</strong> complete datasets</span>
          <span className="chip"><strong className="text-fg">{STATS.stale}</strong> stale, excluded from rankings</span>
          <span className="chip">Latest NAV {fullDate(META.latestNavDate)}</span>
        </div>
        <p className="mt-3 text-xs text-faint">
          Every card names its latest NAV date. Data status &amp; method:{" "}
          <Link className="underline decoration-dotted hover:text-fg" href="/data-status">data status</Link> ·{" "}
          <Link className="underline decoration-dotted hover:text-fg" href="/methodology">methodology</Link>
        </p>
      </header>

      <div className="mt-10">
        <DirectoryControls amcs={AMC_LIST} total={ALL_FUNDS.length} />
      </div>

      <div id="fund-directory" className="mt-10 space-y-14">
        {GROUPS.map((g) => (
          <section key={g.id} id={`grp-${g.id}`} aria-labelledby={`h-${g.id}`} className="reveal">
            <div className="mb-6 flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <h2 id={`h-${g.id}`} className="text-xl font-bold tracking-tight">
                  {g.title} <span className="text-sm font-medium text-faint">({g.funds.length})</span>
                </h2>
                <p className="mt-1 max-w-2xl text-sm text-muted">{g.blurb}</p>
              </div>
              <span className="text-[11px] text-faint">as of {fullDate(META.latestNavDate)}</span>
            </div>
            {g.funds.length ? (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {g.funds
                  .slice()
                  .sort((a, b) => (metricsG3(b.slug) ?? -99) - (metricsG3(a.slug) ?? -99))
                  .map((f) => (
                    <div key={f.slug} className="reveal">
                      <FundCard fund={f} />
                    </div>
                  ))}
              </div>
            ) : (
              <p className="rounded-xl border border-line bg-raised p-4 text-sm text-muted">
                No funds in this category in the current dataset. This is an empty state, not a hidden list.
              </p>
            )}
          </section>
        ))}
      </div>

      <section className="card card-pad mt-14">
        <h2 className="text-lg font-semibold">How to read this list</h2>
        <div className="prose prose-sm mt-3 max-w-none text-muted prose-lab">
          <p>
            The big number is annualised total return over the <strong>same</strong> stated window for every fund
            (one-time investment, dividends reinvested). “Worst fall” is the deepest NAV drawdown — the part of the
            ride that tests your sleep. “Fee” is the recurring annual fee where the data file has one; a dash means
            we do not have it.
          </p>
          <p>
            The quality chip is the one to read first: <strong>Complete</strong> means NAV, fee, size and launch date
            are present and the latest NAV is recent. <strong>Partial data</strong> means something material is
            missing. <strong>Stale</strong> means no NAV in the last 30 days; stale funds are excluded from rankings.
            A source link is shown when the data file carries one.
          </p>
        </div>
      </section>

      <div className="mt-12 flex flex-wrap gap-3 pb-18">
        <Link href="/compare" className="btn-cta">Compare side by side →</Link>
        <Link href="/guides/best-mutual-funds-bangladesh" className="btn-quiet">See the leaderboard →</Link>
      </div>
    </div>
  );
}

function metricsG3(slug: string): number | null {
  const m = metricsFor(slug);
  return m.g3 ?? m.gMax ?? null;
}
