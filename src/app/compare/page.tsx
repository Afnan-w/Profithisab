import type { Metadata } from "next";
import Link from "next/link";
import { getFund, metricsFor, ALL_FUNDS } from "@/lib/returns";
import { BENCHES } from "@/lib/benchmarks";
import { TypeBadge, VerifiedBadge, Badge } from "@/components/ui/badge";
import { CopyButton } from "@/components/ui/copy-button";
import { takaExact, cr, pct } from "@/lib/format";
import { site } from "@/lib/site";
import { pageMeta, breadcrumbSchema } from "@/lib/seo";
import { JsonLd } from "@/components/seo/jsonld";

export const metadata: Metadata = pageMeta({
  title: "Compare Bangladeshi mutual funds side by side",
  description:
    "Two or three Bangladeshi open-end funds on one honest table: fixed 3-year total return, per-year CAGR, the ৳5,000/month SIP replay, fees, size and worst fall. Built from published NAV history by Profithisab.",
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
  if (slugs.length >= 2) return slugs.slice(0, 3);
  if (slugs.length === 1) {
    const pair = slugs[0] === "ekush-first-unit-fund" ? "ucb-income-plus-fund" : "ekush-first-unit-fund";
    return [slugs[0], pair];
  }
  return ["ekush-growth-fund", "idlc-balanced-fund", "ucb-income-plus-fund"];
}

export default async function ComparePage({ searchParams }: { searchParams: Promise<SP> }) {
  const sp = await searchParams;
  const slugs = resolveSelection(sp);
  const funds = slugs.map((s) => getFund(s)!).filter(Boolean);
  const mlist = funds.map((f) => metricsFor(f.slug));
  const g3 = mlist.map((m) => m.g3 ?? m.gMax ?? 0);
  const sanch = BENCHES[0].ann.g3; // percent (11.28)
  const sanchFrac = sanch / 100;
  const bestIdx = g3.indexOf(Math.max(...g3));
  const becameOf = (i: number) => takaExact(100000 * Math.pow(1 + g3[i], 3));

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
          Two or three funds, one table, the same 3-year window. The link to this page carries your exact
          selection — copy it and your friend sees precisely what you see.
        </p>
      </header>

      <div className="card card-pad mt-6">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <FundSwap selected={slugs} />
          <div className="flex flex-wrap items-center gap-2">
            <span className="hidden text-xs text-faint sm:block">
              One-time figures assume ৳1,00,000; SIP replays ৳5,000 monthly · dividends reinvested
            </span>
            <CopyButton text={`${site.url}/compare?funds=${slugs.join(",")}`} label="Copy this comparison" />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="mt-6 overflow-x-auto rounded-xl">
        <table className="w-full min-w-[660px] border-separate border-spacing-0 text-sm">
          <thead>
            <tr>
              <th className="rounded-tl-xl border border-line bg-raised px-3 py-2.5 text-left font-semibold">Metric</th>
              {funds.map((f, i) => (
                <th key={f.slug} className={`border border-line px-3 py-3 text-left ${i === bestIdx ? "bg-brand-50 dark:bg-brand-950/40" : "bg-raised"} ${i === funds.length - 1 ? "rounded-tr-xl" : ""}`}>
                  <span className="block font-semibold">{f.name}</span>
                  <span className="mt-1 flex flex-wrap gap-1">
                    <Link href={`/funds/${f.slug}`} className="text-[11px] font-medium text-brand-700 underline decoration-dotted hover:no-underline dark:text-brand-300">
                      full fund page →
                    </Link>
                  </span>
                  <span className="mt-1 flex flex-wrap gap-1">
                    <TypeBadge type={f.type} shariah={f.shariah} />
                    {f.verified ? <VerifiedBadge /> : null}
                    <Badge tone="neutral">{f.acronym}</Badge>
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="tnum">
            <BigRow label="৳1,00,000 became (3 yr)" best={bestIdx} cells={g3.map((_, i) => becameOf(i))} />
            <Row label="Per year (CAGR)" best={bestIdx} cells={g3.map((g) => pct(g))} />
            <Row label="GAP vs Sanchayapatra" best={bestIdx} sub={`${sanch.toFixed(1)}%/yr fixed, par`} cells={g3.map((g) => `${g - sanchFrac >= 0 ? "+" : "-"}${Math.abs((g - sanchFrac) * 100).toFixed(1)} pp/yr`)} />
            <Row label="৳5,000/mo × 3 yr → value" sub="from ৳1,80,000 paid in" best={bestIdx} cells={mlist.map((m) => (m.sip.final3 === null ? "—" : takaExact(m.sip.final3)))} />
            <Row label="SIP return / year" cells={mlist.map((m) => pct(m.sip.irr3))} />
            <Row label="Worst NAV fall" tone="bad" cells={mlist.map((m) => pct(m.worstFall, { signed: false }))} />
            <Row label="Fee / year" cells={funds.map((f) => `${f.fee.toFixed(2)}%`)} />
            <Row label="As of size" cells={funds.map((f) => `${cr(f.aumCr)} assets`)} />
            <Row label="AMC" plain cells={funds.map((f) => f.amc)} />
            <Row label="Type" plain cells={funds.map((f) => `${f.type}${f.shariah ? " · Shariah" : ""}`)} />
            <Row label="Latest NAV" plain cells={mlist.map((m) => `৳${m.latestNav.toFixed(2)} · ${m.asOf}`)} />
            <Row label="Volatility / yr" cells={mlist.map((m) => `${m.vol.toFixed(1)}%`)} />
            <Row label="Verification" plain cells={funds.map((f) => (f.verified ? "AMC-Verified ✓" : "Published NAV feeds"))} />
          </tbody>
        </table>
      </div>

      <p className="mt-3 text-xs text-faint">
        One-time figures compound the fixed 3-year window ending {site.asOfLong}; the SIP row buys ৳5,000 at each
        month-end NAV across the same 36 months. Dividends reinvested in every line.
        {funds.length < 3 ? " Slot open — add a third fund above." : ""}
      </p>

      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        <Link href="/funds" className="card card-pad transition hover:border-brand-500">
          <h2 className="font-semibold">Browse all 38 funds</h2>
          <p className="mt-1 text-sm text-muted">Growth, balanced, income and Shariah — one window everywhere.</p>
        </Link>
        <Link href="/guides/best-mutual-funds-bangladesh" className="card card-pad transition hover:border-brand-500">
          <h2 className="font-semibold">3-year leaderboard</h2>
          <p className="mt-1 text-sm text-muted">The whole roster ranked by the one honest number.</p>
        </Link>
        <Link href="/guides/sanchayapatra-vs-mutual-funds" className="card card-pad transition hover:border-brand-500">
          <h2 className="font-semibold">Sanchayapatra vs mutual funds</h2>
          <p className="mt-1 text-sm text-muted">Certificates vs units — decided by the numbers, not by ads.</p>
        </Link>
      </section>

      <p className="mt-8 pb-14 text-xs text-faint">
        Figures rebuilt from published NAV history as of {site.asOfLong}. For research — not investment advice.
        Share link: <span className="tnum">/compare?funds={slugs.join(",")}</span>
      </p>
    </div>
  );
}

function Row({ label, cells, tone, sub, best, plain }: { label: string; cells: string[]; tone?: "bad"; sub?: string; best?: number; plain?: boolean }) {
  return (
    <tr>
      <th scope="row" className="border border-line px-3 py-2.5 text-left font-medium text-muted">{label}</th>
      {cells.map((c, i) => (
        <td key={i} className={`border border-line px-3 py-2.5 font-semibold ${tone === "bad" ? "text-red-600 dark:text-red-400" : ""} ${best === i ? "text-brand-700 dark:text-brand-300" : ""} ${plain ? "font-normal" : ""}`}>
          {c}
        </td>
      ))}
      {sub ? <td className="hidden">{sub}</td> : null}
    </tr>
  );
}

function BigRow({ label, cells }: { label: string; best: number; cells: string[] }) {
  return (
    <tr>
      <th scope="row" className="border border-line px-3 py-3 text-left text-muted">{label}</th>
      {cells.map((c, i) => (
        <td key={i} className="border border-line px-3 py-3 font-bold tnum">
          <span className="text-base text-brand-600 dark:text-brand-400">{c}</span>
        </td>
      ))}
    </tr>
  );
}

function FundSwap({ selected }: { selected: string[] }) {
  return (
    <form action="/compare" method="get" className="flex flex-wrap items-end gap-2">
      {selected.map((s, i) => (
        <select key={i} name="funds" defaultValue={s} className="rounded-lg border border-line bg-surface px-2.5 py-1.5 text-xs" aria-label={`Fund ${i + 1}`}>
          {ALL_FUNDS.map((f) => (
            <option key={f.slug} value={f.slug}>
              {f.name}
            </option>
          ))}
        </select>
      ))}
      <button type="submit" className="btn-cta !px-3 !py-1.5 text-xs">Swap &amp; compare</button>
    </form>
  );
}
