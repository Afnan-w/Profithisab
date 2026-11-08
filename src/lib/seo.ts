import type { Metadata } from "next";
import { site } from "@/lib/site";

/** Shared metadata builder: canonical + OG defaults per page. */
export function pageMeta(opts: {
  title: string;
  description: string;
  path: string; // "/funds" (no trailing slash)
  ogType?: "website" | "article";
  keywords?: string[];
}): Metadata {
  return {
    title: { absolute: opts.title },
    description: opts.description,
    keywords: opts.keywords,
    alternates: { canonical: opts.path },
    openGraph: {
      title: opts.title,
      description: opts.description,
      url: `${site.url}${opts.path}`,
      type: opts.ogType ?? "website",
    },
    twitter: {
      card: "summary_large_image",
      title: opts.title,
      description: opts.description,
    },
  };
}

/* ── JSON-LD builders ─────────────────────────────────────────────────────── */

export function orgSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Profithisab",
    url: site.url,
    logo: `${site.url}/icon-512.png`,
    description:
      "Rebuilds published NAV history of Bangladeshi open-end mutual funds into honest, comparable return figures.",
    sameAs: Object.values(site.links),
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: site.contactEmail,
        availableLanguage: ["English", "Bengali"],
      },
    ],
  };
}

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Profithisab",
    alternateName: "লাভকতো",
    url: site.url,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${site.url}/funds?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };
}

export function breadcrumbSchema(items: Array<{ name: string; path: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: it.name,
      item: `${site.url}${it.path}`,
    })),
  };
}

export function faqPageSchema(faqs: Array<{ q: string; a: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    })),
  };
}

export function articleSchema(p: {
  title: string;
  description: string;
  path: string;
  datePublished: string;
  dateModified?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: p.title,
    description: p.description,
    mainEntityOfPage: `${site.url}${p.path}`,
    publisher: { "@type": "Organization", name: "Profithisab", logo: { "@type": "ImageObject", url: `${site.url}/icon-512.png` } },
    author: { "@type": "Organization", name: "Profithisab" },
    datePublished: p.datePublished,
    dateModified: p.dateModified ?? p.datePublished,
    inLanguage: "en-BD",
  };
}

export function investmentFundSchema(p: {
  name: string;
  slug: string;
  manager: string;
  category: string;
  currency: string;
  minInvestment: number;
  description: string;
  rateOfReturn?: number;
  isShariah?: boolean;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "InvestmentFund",
    name: p.name,
    url: `${site.url}/funds/${p.slug}`,
    description: p.description,
    category: p.category,
    offeredBy: { "@type": "FinancialService", name: p.manager },
    provider: { "@type": "FinancialService", name: p.manager },
    isAccessibleForFree: true,
    inLanguage: "en-BD",
    ...(p.isShariah ? { additionalProperty: { "@type": "PropertyValue", name: "Shariah-compliant", value: "yes" } } : {}),
    potentialAction: {
      "@type": "InvestorExperience",
      minInvestment: {
        "@type": "MonetaryAmount",
        currency: "BDT",
        value: p.minInvestment,
      },
    },
    ...(p.rateOfReturn !== undefined
      ? {
          interestRate: {
            "@type": "QuantitativeValue",
            value: Number(p.rateOfReturn.toFixed(2)),
            unitText: "PERCENT / YEAR",
          },
        }
      : {}),
  };
}

export function itemListSchema(paths: string[], names: string[]) {
  return {
    "@context": "https://schema.org",
    "@type": "ItemList",
    numberOfItems: paths.length,
    itemListElement: paths.map((_, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${site.url}${paths[i]}`,
      name: names[i],
    })),
  };
}
