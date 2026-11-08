import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { POSTS } from "@/data/posts";
import { Blocks } from "@/components/content/blocks";
import { pageMeta, articleSchema, breadcrumbSchema } from "@/lib/seo";
import { JsonLd } from "@/components/seo/jsonld";
import { longDate } from "@/lib/format";

export function generateStaticParams() {
  return POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const post = POSTS.find((p) => p.slug === slug);
  if (!post) return pageMeta({ title: "Post not found", description: "No such post.", path: `/blog/${slug}` });
  return pageMeta({
    title: post.title,
    description: post.description,
    path: `/blog/${post.slug}`,
    ogType: "article",
    keywords: post.keywords,
  });
}

export default async function PostPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = POSTS.find((p) => p.slug === slug);
  if (!post) notFound();

  return (
    <div className="mx-auto max-w-4xl px-4 pt-8 sm:px-6">
      <JsonLd
        objects={[
          breadcrumbSchema([
            { name: "Home", path: "/" },
            { name: "Blog", path: "/blog" },
            { name: post.title, path: `/blog/${post.slug}` },
          ]),
          articleSchema({
            title: post.title,
            description: post.description,
            path: `/blog/${post.slug}`,
            datePublished: post.date,
            dateModified: post.date,
          }),
        ]}
      />
      <nav aria-label="Breadcrumb" className="mb-3 text-xs text-muted">
        <Link href="/" className="hover:text-fg">Home</Link> →{" "}
        <Link href="/blog" className="hover:text-fg">Blog</Link> →{" "}
        <span className="text-fg">{post.title.slice(0, 44)}…</span>
      </nav>
      <header className="max-w-2xl">
        <p className="text-xs text-faint">{longDate(post.date)}</p>
        <h1 className="mt-2 text-3xl font-bold leading-tight tracking-tight sm:text-4xl">{post.title}</h1>
        <p className="mt-3 text-lg leading-relaxed text-muted">{post.description}</p>
      </header>
      <article className="mt-8">
        <Blocks blocks={post.blocks} />
      </article>
      <div className="mt-10 flex flex-wrap gap-3 pb-14">
        <Link href="/guides/best-mutual-funds-bangladesh" className="btn-quiet text-sm">Full leaderboard →</Link>
        <Link href="/blog" className="btn-quiet text-sm">All posts →</Link>
      </div>
    </div>
  );
}
