import type { MetadataRoute } from "next";
import { site } from "@/lib/site";
import { ALL_FUNDS, META } from "@/lib/returns";
import { GUIDES } from "@/data/guides";
import { CUSTOM_GUIDES } from "@/data/custom-guides";
import { POSTS } from "@/data/posts";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = site.url;
  const dataDate = new Date(META.latestNavDate ?? META.lastUpdated);

  const statics: MetadataRoute.Sitemap = ([
    { url: base, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/funds`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/compare`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/guides`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/blog`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/methodology`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/data-status`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${base}/hub`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${base}/hub/mutual-funds`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/hub/savings`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${base}/hub/opportunities`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${base}/hub/calculators`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${base}/about`, changeFrequency: "yearly", priority: 0.5 },
    { url: `${base}/invest`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${base}/privacy`, changeFrequency: "yearly", priority: 0.3 },
  ] as const).map((e) => ({ ...e, lastModified: dataDate }));

  const funds: MetadataRoute.Sitemap = ALL_FUNDS.map((f) => ({
    url: `${base}/funds/${f.slug}`,
    lastModified: f.latestNavDate ? new Date(f.latestNavDate) : dataDate,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const hubFunds: MetadataRoute.Sitemap = ALL_FUNDS.map((f) => ({
    url: `${base}/hub/mutual-funds/${f.slug}`,
    lastModified: f.latestNavDate ? new Date(f.latestNavDate) : dataDate,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const learn: MetadataRoute.Sitemap = [
    ...GUIDES.map((g) => ({
      url: `${base}/guides/${g.slug}`,
      lastModified: new Date(g.updated ?? g.published),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...CUSTOM_GUIDES.map((g) => ({
      url: `${base}/guides/${g.slug}`,
      lastModified: new Date(g.updated ?? g.published),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...POSTS.map((p) => ({
      url: `${base}/blog/${p.slug}`,
      lastModified: new Date(p.date),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];

  return [...statics, ...funds, ...hubFunds, ...learn];
}
