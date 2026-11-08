import type { Metadata } from "next";
import Link from "next/link";
import { POSTS } from "@/data/posts";
import { pageMeta, breadcrumbSchema, itemListSchema } from "@/lib/seo";
import { JsonLd } from "@/components/seo/jsonld";
import { longDate } from "@/lib/format";

export const metadata: Metadata = pageMeta({
  title: "Blog — rankings, replays and updates",
  description:
    "Monthly data-driven notes from Profithisab: fresh 3-year rankings, SIP replays across the tracked Bangladeshi open-end funds, methodology updates, and dataset status notes.",
  path: "/blog",
});

export default function BlogIndex() {
  return (
    <div className="mx-auto max-w-3xl px-4 pt-10 sm:px-6">
      <JsonLd
        objects={[
          breadcrumbSchema([{ name: "Home", path: "/" }, { name: "Blog", path: "/blog" }]),
          itemListSchema(
            POSTS.map((p) => `/blog/${p.slug}`),
            POSTS.map((p) => p.title)
          ),
        ]}
      />
      <nav aria-label="Breadcrumb" className="mb-3 text-xs text-muted">
        <Link href="/" className="hover:text-fg">Home</Link> → <span className="text-fg">Blog</span>
      </nav>
      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">The Profithisab log</h1>
      <p className="mt-3 text-muted">
        Short, dated notes as the window rolls — rankings, replays, and anything that keeps the data honest.
      </p>
      <div className="mt-8 space-y-4">
        {POSTS.map((p) => (
          <Link key={p.slug} href={`/blog/${p.slug}`} className="card card-pad block transition hover:border-brand-500">
            <p className="text-xs text-faint">{longDate(p.date)}</p>
            <h2 className="mt-1 font-semibold">{p.title}</h2>
            <p className="mt-1.5 text-sm text-muted">{p.description}</p>
          </Link>
        ))}
      </div>
      <p className="mt-10 pb-14 text-xs text-faint">One post beats ten promises. We write when there is something to count.</p>
    </div>
  );
}
