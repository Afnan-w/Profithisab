import type { Metadata } from "next";
import Link from "next/link";
import { GUIDES } from "@/data/guides";
import { CUSTOM_GUIDES } from "@/data/custom-guides";
import { pageMeta, breadcrumbSchema, itemListSchema } from "@/lib/seo";
import { JsonLd } from "@/components/seo/jsonld";
import { fullDate, longDate } from "@/lib/format";
import { META } from "@/lib/returns";

export const metadata: Metadata = pageMeta({
  title: "Learn mutual funds in Bangladesh — plain-language guides",
  description:
    "Short, honest guides on Bangladeshi open-end mutual funds: how to invest (BO account, KYC, SIP, redemption), Shariah compliance, NAV & glossary, tax treatment, Sanchayapatra comparisons and data-driven rankings.",
  path: "/guides",
  keywords: ["mutual fund guides bangladesh", "SIP guide BD", "learn mutual funds bangla"],
});

export default function GuidesIndex() {
  const all = [
    ...CUSTOM_GUIDES.map((g) => ({
      slug: g.slug,
      title: g.title,
      description: g.description,
      published: g.published,
      updated: g.updated,
    })),
    ...GUIDES.map((g) => ({
      slug: g.slug,
      title: g.title,
      description: g.description,
      published: g.published,
      updated: g.updated,
    })),
  ];

  return (
    <div className="mx-auto max-w-6xl px-4 pt-10 sm:px-6">
      <JsonLd
        objects={[
          breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Learn", path: "/guides" }]),
          itemListSchema(
            all.map((g) => `/guides/${g.slug}`),
            all.map((g) => g.title)
          ),
        ]}
      />

      <nav aria-label="Breadcrumb" className="mb-3 text-xs text-muted">
        <Link href="/" className="hover:text-fg">Home</Link> → <span className="text-fg">Learn</span>
      </nav>

      <header className="max-w-3xl">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Learn — mutual funds in Bangladesh, minus the fog</h1>
        <p className="mt-3 text-muted">
          Every guide is written to answer the questions people actually ask their accountant at Eid — in plain
          language, with the numbers shown rather than the vibes.
        </p>
      </header>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        {all.map((g) => (
          <Link key={g.slug} href={`/guides/${g.slug}`} className="card card-pad transition hover:border-brand-500">
            <h2 className="font-semibold leading-snug">{g.title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">{g.description}</p>
            <p className="mt-3 text-[11px] text-faint">
              Updated {longDate(g.updated ?? g.published)}
            </p>
          </Link>
        ))}
      </div>

      <p className="mt-10 pb-14 text-xs text-faint">
        Figures on the data-driven guides use the latest NAV in this build: {fullDate(META.latestNavDate)}. Rates and
        tax treatment change: verify the current year&apos;s Finance Act or a tax professional before acting.
      </p>
    </div>
  );
}
