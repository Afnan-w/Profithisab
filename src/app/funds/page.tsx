import type { Metadata } from "next";
import Link from "next/link";
import { ALL_FUNDS, fundGroups, AMCs, TOTAL_AUM_CR, VERIFIED_COUNT, metricsFor } from "@/lib/returns";
import { FundCard } from "@/components/funds/fund-card";
import { DirectoryControls } from "@/components/funds/directory-controls";
import { cr } from "@/lib/format";
import { site } from "@/lib/site";
import { pageMeta, itemListSchema, breadcrumbSchema } from "@/lib/seo";
import { JsonLd } from "@/components/seo/jsonld";
import { longDate } from "@/lib/format";

export const metadata: Metadata = pageMeta({
  title: "Bangladeshi open-end mutual funds — real 3-year returns",
  description: `All ${ALL_FUNDS.length} open-end funds Profithisab tracks — growth, balanced, income and Shariah — with the same 3-year window for every fund, AMC-verified flags, fees and worst falls. Figures as of ${site.asOfLong}.`,
  path: "/funds",
  keywords: [
    "open end mutual fund Bangladesh",
    "Bangladesh mutual fund list",
    "mutual fund NAV Bangladesh",
    "Shariah mutual fund Bangladesh",
  ],
});

const GROUPS: Array<{ id: string; title: string; blurb: string; funds: typeof ALL_FUNDS }> = [
  {
    id: "growth",
    title: "Growth funds",
    blurb: "Equity-first portfolios. Winner-take-the-market, and the market in Bangladesh has not been gently upward.",
    funds: fundGroups.growth,
  },
  {
    id: "balanced",
    title: "Balanced funds",
    blurb: "A bet both ways — part equity, part fixed income. Smoother than growth funds, duller in a bull run.",
    funds: fundGroups.balanced,
  },
  {
    id: "income",
    title: "Income funds",
    blurb: "Fixed-income boxes. The question is less “what will it earn” and more “what will the manager sack it with in fees”.",
    funds: fundGroups.income,
  },
  {
    id: "shariah",
    title: "Shariah-compliant funds",
    blurb: "Halal-screened portfolios. They also appear under their own Growth, Balanced or Income category above.",
    funds: fundGroups.shariah,
  },
];

export default function FundsPage() {
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
          Profithisab tracks {ALL_FUNDS.length} of Bangladesh&apos;s 100+ open-end funds: the ones whose NAV
          history and dividends are published consistently enough to replay honestly.
        </p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs">
          <span className="chip"><strong className="text-fg">{VERIFIED_COUNT}</strong> AMC-Verified</span>
          <span className="chip"><strong className="text-fg">{cr(TOTAL_AUM_CR)}</strong> managed between them</span>
          <span className="chip">One fixed 3-yr window for every fund</span>
          <span className="chip">Dividends reinvested</span>
        </div>
        <p className="mt-3 text-xs text-faint">Figures as of {site.asOfLong} · Data status & method: <Link className="underline decoration-dotted hover:text-fg" href="/methodology">methodology</Link></p>
      </header>

      <div className="mt-8">
        <DirectoryControls amcs={AMCs} total={ALL_FUNDS.length} />
      </div>

      <div id="fund-directory" className="mt-8 space-y-12">
        {GROUPS.map((g) => (
          <section key={g.id} id={`grp-${g.id}`} aria-labelledby={`h-${g.id}`}>
            <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
              <div>
                <h2 id={`h-${g.id}`} className="text-xl font-bold tracking-tight">
                  {g.title} <span className="text-sm font-medium text-faint">({g.funds.length})</span>
                </h2>
                <p className="mt-1 max-w-2xl text-sm text-muted">{g.blurb}</p>
              </div>
              <span className="text-[11px] text-faint">as of {longDate(site.asOf)}</span>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {g.funds
                .slice()
                .sort((a, b) => (metricsG3(b.slug) ?? -99) - (metricsG3(a.slug) ?? -99))
                .map((f) => (
                  <div
                    key={f.slug}
                    data-fund-id={f.slug}
                    data-fund-name={f.name}
                    data-fund-amc={f.amc}
                    data-fund-amc-slug={f.amcSlug}
                    data-fund-type={f.type}
                    data-fund-shariah={f.shariah ? "1" : "0"}
                    data-fund-verified={f.verified ? "1" : "0"}
                    data-fund-acronym={f.acronym}
                  >
                    <FundCard fund={f} />
                  </div>
                ))}
            </div>
          </section>
        ))}
      </div>

      <section className="card card-pad mt-12">
        <h2 className="text-lg font-semibold">How to read this list</h2>
        <div className="prose prose-sm mt-3 max-w-none text-muted prose-lab">
          <p>
            Big number = annualized total return over the <strong>same</strong> three-year window for every
            fund (one-time investment, dividends reinvested). “Worst fall” is the deepest NAV drawdown — the
            part of the ride that tests your sleep. “Fee” is the recurring annual fee from the prospectus;
            over a decade a 2.5% fee eats roughly a quarter of your compounding.
          </p>
          <p>
            And the label your eye should hunt for first: <strong>AMC-Verified</strong> — for these funds the
            NAV/dividend series was cross-checked with the asset manager itself. The rest are sourced from
            published NAV feeds and marked un-verified until we finish the rounds (see{" "}
            <Link href="/methodology">methodology</Link>).
          </p>
        </div>
      </section>

      <div className="mt-10 flex flex-wrap gap-3">
        <Link href="/compare" className="btn-cta">Compare side by side →</Link>
        <Link href="/guides/best-mutual-funds-bangladesh" className="btn-quiet">See the 3-year leaderboard →</Link>
      </div>
    </div>
  );
}

function metricsG3(slug: string): number | null {
  const m = metricsFor(slug);
  return m.g3 ?? m.gMax ?? null;
}
