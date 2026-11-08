import Link from "next/link";

/* ── Structured content blocks for guides & blog (no MDX dependency) ─────── */

export type Block =
  | { t: "p"; md: string } // *emphasis* only
  | { t: "h2"; text: string; id?: string }
  | { t: "h3"; text: string; id?: string }
  | { t: "ul"; items: string[] }
  | { t: "ol"; items: string[] }
  | { t: "callout"; title: string; md: string; tone?: "brand" | "amber" | "slate" }
  | { t: "table"; head: string[]; rows: string[][] }
  | { t: "dl"; rows: Array<[string, string]> }
  | { t: "rank"; source: "g3" | "sip3" | "income" | "worst"; n: number; title: string }
  | { t: "cta"; href: string; label: string };

export interface Guide {
  slug: string;
  title: string;
  description: string;
  published: string; // ISO date
  updated?: string;
  keywords: string[];
  kind: "blocks" | "custom";
  blocks?: Block[];
  faqs: Array<{ q: string; a: string }>;
  related?: Array<{ href: string; label: string }>;
}

export interface Post {
  slug: string;
  title: string;
  description: string;
  date: string;
  keywords: string[];
  blocks: Block[];
}

/* ── Renderer ────────────────────────────────────────────────────────────── */

import { ALL_FUNDS, metricsFor } from "@/lib/returns";

function Emphasis({ md }: { md: string }) {
  // minimal *em* renderer — keeps content data plain
  const parts = md.split(/[*]/);
  return (
    <>
      {parts.map((p, i) => (i % 2 === 1 ? <strong key={i} className="font-semibold text-fg">{p}</strong> : <span key={i}>{p}</span>))}
    </>
  );
}

function P({ children }: { children: React.ReactNode }) {
  return <p className="mt-4 leading-7 text-fg-soft first:mt-0">{children}</p>;
}

function RankList({ source, n, title }: { source: NonNullable<Extract<Block, { t: "rank" }>>["source"]; n: number; title: string }) {
  const scored = ALL_FUNDS.map((f) => {
    const m = metricsFor(f.slug);
    let v = 0;
    if (source === "g3") v = m.g3 ?? m.gMax ?? -99;
    if (source === "sip3") v = m.sip.irr3 ?? -99;
    if (source === "income") v = f.type === "income" ? (m.g3 ?? m.gMax ?? -99) : -99;
    if (source === "worst") v = Math.abs(m.worstFall);
    return { f, v };
  })
    .filter((e) => e.v > -50)
    .sort((a, b) => (source === "worst" ? a.v - b.v : b.v - a.v))
    .slice(0, n);

  return (
    <div className="card card-pad mt-5 not-prose">
      <p className="text-sm font-semibold">{title}</p>
      <table className="mt-3 w-full text-sm">
        <thead>
          <tr className="text-left text-xs text-faint">
            <th className="pb-1.5 font-medium">#</th>
            <th className="pb-1.5 font-medium">Fund</th>
            <th className="pb-1.5 font-medium">Type</th>
            <th className="pb-1.5 text-right font-medium">{source === "worst" ? "Worst fall" : source === "sip3" ? "SIP / yr" : "3-yr / yr"}</th>
          </tr>
        </thead>
        <tbody className="tnum">
          {scored.map((e, i) => (
            <tr key={e.f.slug} className="border-t border-line">
              <td className="py-2 text-muted">{i + 1}</td>
              <td className="py-2 font-medium">
                <Link href={`/funds/${e.f.slug}`} className="hover:text-brand-700 dark:hover:text-brand-300">{e.f.name}</Link>
                <span className="ml-1.5 text-[10px] text-faint">{e.f.amc}</span>
              </td>
              <td className="py-2 text-muted capitalize">{e.f.type}{e.f.shariah ? " · Shariah" : ""}</td>
              <td className="py-2 text-right font-semibold">
                {source === "worst" ? `−${Math.abs(metricsFor(e.f.slug).worstFall * 100).toFixed(1)}%` : `${(e.v * 100).toFixed(2)}%`}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function Blocks({ blocks }: { blocks: Block[] }) {
  return (
    <div className="max-w-none">
      {blocks.map((b, i) => {
        switch (b.t) {
          case "p":
            return <P key={i}><Emphasis md={b.md} /></P>;
          case "h2":
            return (
              <h2 key={i} id={b.id ?? slugify(b.text)} className="mt-10 scroll-mt-20 text-2xl font-bold tracking-tight first:mt-0">
                {b.text}
              </h2>
            );
          case "h3":
            return (
              <h3 key={i} id={b.id ?? slugify(b.text)} className="mt-8 scroll-mt-20 text-lg font-semibold">
                {b.text}
              </h3>
            );
          case "ul":
            return (
              <ul key={i} className="mt-4 list-disc space-y-1.5 pl-5 leading-7 text-fg-soft">
                {b.items.map((it, j) => <li key={j}><Emphasis md={it} /></li>)}
              </ul>
            );
          case "ol":
            return (
              <ol key={i} className="mt-4 list-decimal space-y-1.5 pl-5 leading-7 text-fg-soft">
                {b.items.map((it, j) => <li key={j}><Emphasis md={it} /></li>)}
              </ol>
            );
          case "callout":
            return (
              <div
                key={i}
                className={`mt-6 rounded-xl border p-4 text-sm leading-relaxed ${
                  b.tone === "amber"
                    ? "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40"
                    : b.tone === "slate"
                      ? "border-line bg-raised"
                      : "border-brand-200 bg-brand-50 dark:border-brand-900 dark:bg-brand-950/40"
                }`}
              >
                <p className="font-semibold text-fg">{b.title}</p>
                <p className="mt-1 text-fg-soft"><Emphasis md={b.md} /></p>
              </div>
            );
          case "table":
            return (
              <div key={i} className="mt-6 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-line-strong text-left text-xs text-faint">
                      {b.head.map((h, j) => <th key={j} className="pb-2 pr-4 font-medium">{h}</th>)}
                    </tr>
                  </thead>
                  <tbody>
                    {b.rows.map((r, j) => (
                      <tr key={j} className="border-b border-line">
                        {r.map((c, k) => (
                          <td key={k} className={`py-2 pr-4 ${k === 0 ? "font-medium text-fg" : "text-fg-soft tnum"}`}>
                            <Emphasis md={c} />
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          case "dl":
            return (
              <dl key={i} className="mt-5 grid gap-2.5">
                {b.rows.map(([k, v], j) => (
                  <div key={j} className="border-b border-line pb-2.5">
                    <dt className="text-sm font-semibold text-fg">{k}</dt>
                    <dd className="text-sm text-fg-soft"><Emphasis md={v} /></dd>
                  </div>
                ))}
              </dl>
            );
          case "rank":
            return <RankList key={i} source={b.source} n={b.n} title={b.title} />;
          case "cta":
            return (
              <div key={i} className="mt-6">
                <Link href={b.href} className="btn-cta">{b.label}</Link>
              </div>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}

export function slugify(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
