import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta, breadcrumbSchema } from "@/lib/seo";
import { JsonLd } from "@/components/seo/jsonld";
import { HubCalculators, type CalcTaxConfig } from "@/components/hub/calculators";
import { HubNotice, Provenance } from "@/components/hub/provenance";
import { taxConfig } from "@/lib/hub";
import { fullDate } from "@/lib/format";

export const metadata: Metadata = pageMeta({
  title: "Investment calculators — SIP, lump sum, FDR & Sonchayapatra",
  description:
    "SIP, lump sum, FDR and Sonchayapatra calculators with the tax assumptions shown (config/tax.json). Estimates for illustration only — information, not investment advice. Past performance does not guarantee future results.",
  path: "/hub/calculators",
  keywords: ["SIP calculator Bangladesh", "FDR maturity calculator", "Sanchayapatra calculator", "lump sum calculator"],
});

export default function HubCalculatorsPage() {
  const tax: CalcTaxConfig = taxConfig();

  return (
    <div className="mx-auto max-w-6xl px-4 pt-10 sm:px-6">
      <JsonLd
        objects={[
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Data Hub", path: "/hub" },
            { name: "Calculators", path: "/hub/calculators" },
          ]),
        ]}
      />

      <nav aria-label="Breadcrumb" className="mb-3 text-xs text-muted">
        <Link href="/" className="hover:text-fg">Home</Link> →{" "}
        <Link href="/hub" className="hover:text-fg">Data Hub</Link> → <span className="text-fg">Calculators</span>
      </nav>

      <header className="max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Calculators</h1>
        <p className="mt-3 text-muted">
          SIP, lump sum, FDR maturity and Sonchayapatra payout calculators. Every assumption — return rate, tax rate,
          compounding — is an input you can see and change. The results are arithmetic on your assumptions, not
          forecasts and not advice.
        </p>
      </header>

      <div className="mt-6">
        <HubNotice />
      </div>

      <div className="mt-6">
        <HubCalculators tax={tax} />
      </div>

      <section className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="card card-pad">
          <h2 className="text-lg font-semibold">Assumptions used</h2>
          <dl className="mt-3 space-y-2 text-sm">
            <div className="flex justify-between gap-3 border-b border-line pb-2">
              <dt className="text-muted">Tax config as of</dt>
              <dd className="tnum font-medium">{fullDate(tax.asOf)}</dd>
            </div>
            <div className="flex justify-between gap-3 border-b border-line pb-2">
              <dt className="text-muted">FDR interest TDS (estimate)</dt>
              <dd className="tnum font-medium">{tax.fdr.interestTaxPct}%</dd>
            </div>
            <div className="flex justify-between gap-3 border-b border-line pb-2">
              <dt className="text-muted">Savings interest TDS (estimate)</dt>
              <dd className="tnum font-medium">{tax.sonchayapatra.interestTaxPct}%</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Mutual-fund dividend / gains tax (estimate)</dt>
              <dd className="tnum font-medium">
                {tax.mutualFund.dividendTaxPct}% / {tax.mutualFund.capitalGainsTaxPct}%
              </dd>
            </div>
          </dl>
          <p className="mt-3 text-xs leading-relaxed text-faint">{tax.note}</p>
        </div>

        <div className="card card-pad">
          <h2 className="text-lg font-semibold">What these calculators are not</h2>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-relaxed text-muted">
            <li>Not a projection of any fund&apos;s actual returns — a constant rate is an assumption you choose.</li>
            <li>Not tax advice: actual TDS depends on filer status, instrument and the applicable finance act.</li>
            <li>Not a recommendation to open any account or buy any instrument.</li>
            <li>SIP results assume a fixed monthly contribution at the start of each month; real NAVs move up and down.</li>
          </ul>
          <p className="mt-3 text-xs leading-relaxed text-faint">
            Source data for the rates you may use here lives on the{" "}
            <Link href="/hub/savings" className="underline decoration-dotted hover:text-fg">savings</Link> and{" "}
            <Link href="/hub/opportunities" className="underline decoration-dotted hover:text-fg">opportunities</Link>{" "}
            pages, each with its own source and date.
          </p>
        </div>
      </section>

      <Provenance
        sourceName="Calculator tax configuration (config/tax.json)"
        dataDate={tax.asOf}
        fetchedAt={null}
        note={tax.note}
      />

      <p className="mt-6 pb-14 text-xs text-faint">
        Past performance does not guarantee future results. Information only. Not investment advice. Check the
        fund&apos;s official prospectus before investing.
      </p>
    </div>
  );
}
