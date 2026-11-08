import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { GUIDES } from "@/data/guides";
import { CUSTOM_GUIDES, asGuide, customGuideDef } from "@/data/custom-guides";
import { BestFundsGuide, SanchayapatraGuide } from "@/components/content/custom-guides";
import { Blocks, type Guide, type Block } from "@/components/content/blocks";
import { pageMeta, articleSchema, faqPageSchema, breadcrumbSchema } from "@/lib/seo";
import { JsonLd } from "@/components/seo/jsonld";
import { longDate } from "@/lib/format";

export function generateStaticParams() {
  return [...GUIDES.map((g) => ({ slug: g.slug })), ...CUSTOM_GUIDES.map((g) => ({ slug: g.slug }))];
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const guide =
    GUIDES.find((g) => g.slug === slug) ??
    (() => {
      const d = customGuideDef(slug);
      return d ? asGuide(d) : undefined;
    })();
  if (!guide) {
    return pageMeta({ title: "Guide not found | Profithisab", description: "No such guide.", path: `/guides/${slug}` });
  }
  return pageMeta({
    title: guide.title,
    description: guide.description,
    path: `/guides/${guide.slug}`,
    ogType: "article",
    keywords: guide.keywords,
  });
}

export default async function GuidePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const guide: Guide | undefined = GUIDES.find((g) => g.slug === slug) ??
    (customGuideDef(slug) ? asGuide(customGuideDef(slug)!) : undefined);
  if (!guide) notFound();

  return (
    <div className="mx-auto max-w-4xl px-4 pt-8 sm:px-6">
      <JsonLd
        objects={[
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Learn", path: "/guides" },
            { name: guide.title, path: `/guides/${guide.slug}` },
          ]),
          faqPageSchema(guide.faqs),
          articleSchema({
            title: guide.title,
            description: guide.description,
            path: `/guides/${guide.slug}`,
            datePublished: guide.published,
            dateModified: guide.updated ?? guide.published,
          }),
        ]}
      />

      <nav aria-label="Breadcrumb" className="mb-3 text-xs text-muted">
        <Link href="/" className="hover:text-fg">Home</Link> →{" "}
        <Link href="/guides" className="hover:text-fg">Learn</Link> →{" "}
        <span className="text-fg">{guide.title.slice(0, 48)}{guide.title.length > 48 ? "…" : ""}</span>
      </nav>

      <header className="max-w-2xl">
        <p className="text-xs text-faint">
          Published {longDate(guide.published)}
          {guide.updated ? ` · updated ${longDate(guide.updated)}` : ""} · figures as of our latest NAV window
        </p>
        <h1 className="mt-2 text-3xl font-bold leading-tight tracking-tight sm:text-4xl">{guide.title}</h1>
        <p className="mt-3 text-lg leading-relaxed text-muted">{guide.description}</p>
      </header>

      <article className="mt-8">
        {guide.kind === "custom" ? (
          guide.slug === "best-mutual-funds-bangladesh" ? <BestFundsGuide /> : <SanchayapatraGuide />
        ) : (
          <Blocks blocks={guide.blocks ?? []} />
        )}
      </article>

      {/* FAQ */}
      <section className="mt-12">
        <h2 className="text-2xl font-bold tracking-tight">Questions people actually ask</h2>
        <div className="mt-4 space-y-2">
          {guide.faqs.map((f) => (
            <details key={f.q} className="card px-4 py-3">
              <summary className="cursor-pointer list-none font-medium">{f.q}</summary>
              <p className="mt-2 text-sm leading-relaxed text-muted">{f.a}</p>
            </details>
          ))}
        </div>
      </section>

      {/* Related */}
      {guide.related?.length ? (
        <section className="mt-10">
          <h2 className="text-lg font-semibold">Continue reading</h2>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {guide.related.map((r) => (
              <Link key={r.href} href={r.href} className="card card-pad text-sm font-medium transition hover:border-brand-500">
                {r.label} →
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      {/* In-guide fund links */}
      <section className="mt-10 pb-12">
        <div className="card card-pad">
          <p className="text-sm text-muted">
            Everything the guides promise, we practice: every figure on Profithisab lists its{" "}
            <Link href="/methodology" className="underline decoration-dotted hover:text-fg">build recipe</Link>. If a
            number can&apos;t be traced to a published NAV, it doesn&apos;t appear. Start with the{" "}
            <Link href="/funds" className="underline decoration-dotted hover:text-fg">fund directory</Link> or{" "}
            <Link href="/compare" className="underline decoration-dotted hover:text-fg">compare two funds</Link>.
          </p>
        </div>
      </section>
    </div>
  );
}
