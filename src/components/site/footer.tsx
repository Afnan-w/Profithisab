import Link from "next/link";
import { ATTRIBUTION, IS_DEMO, LICENSE, META } from "@/lib/returns";
import { fullDate } from "@/lib/format";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-line">
      <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-10 md:grid-cols-4">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-3">
              <svg className="h-6 w-6" viewBox="0 0 32 32" aria-hidden="true">
                <defs>
                  <linearGradient id="lg" x1="0" y1="1" x2="1" y2="0">
                    <stop offset="0" stopColor="#059669" />
                    <stop offset="1" stopColor="#10b981" />
                  </linearGradient>
                </defs>
                <rect width="32" height="32" rx="8" fill="url(#lg)" />
                <path d="M6 21.5 L12 15 L16 18.2 L24 8.5" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M18.5 8.5 H24 V14" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="6" cy="25.5" r="1.6" fill="#d1fae5" />
              </svg>
              <span className="text-lg font-bold tracking-tight">Profithisab</span>
            </div>
            <p className="max-w-sm text-sm text-muted leading-relaxed">
              Real returns of Bangladeshi mutual funds, replayed from the NAV and dividend history in our data files.
              Free, no login, no sales talk.
            </p>
            <p className="mt-4 text-xs text-faint leading-relaxed">
              Data updated {fullDate(META.lastUpdated)} · Latest NAV {fullDate(META.latestNavDate)} ·{" "}
              <Link href="/data-status" className="underline decoration-dotted hover:text-fg">per-fund data status</Link>
            </p>
          </div>

          <nav aria-label="Footer tools">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted mb-3">Tools</p>
            <ul className="space-y-2 text-sm text-muted">
              <li><Link className="hover:text-fg transition-colors" href="/">Calculator</Link></li>
              <li><Link href="/funds" className="hover:text-fg transition-colors">Funds</Link></li>
              <li><Link href="/compare" className="hover:text-fg transition-colors">Compare</Link></li>
              <li><Link href="/guides/best-mutual-funds-bangladesh" className="hover:text-fg transition-colors">Best funds, 3-year</Link></li>
            </ul>
          </nav>

          <nav aria-label="Footer learn">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted mb-3">Learn</p>
            <ul className="space-y-2 text-sm text-muted">
              <li><Link href="/guides" className="hover:text-fg transition-colors">Guides</Link></li>
              <li><Link href="/methodology" className="hover:text-fg transition-colors">Methodology</Link></li>
              <li><Link href="/data-status" className="hover:text-fg transition-colors">Data status</Link></li>
              <li><Link href="/about" className="hover:text-fg transition-colors">About</Link></li>
              <li><Link href="/invest" className="hover:text-fg transition-colors">Invest with our partners</Link></li>
              <li><Link href="/privacy" className="hover:text-fg transition-colors">Privacy</Link></li>
            </ul>
          </nav>
        </div>

        <div className="mt-10 rounded-2xl border border-line bg-raised p-5 text-xs leading-relaxed text-muted">
          {IS_DEMO ? (
            <p>
              <strong className="text-amber-700 dark:text-amber-300">Demo dataset.</strong> The NAV histories on this
              build are generated to test layout and maths. They are not published fund data. A real import replaces
              them and the demo banner disappears. Nothing here is investment advice; past numbers describe the past,
              not the future.
            </p>
          ) : (
            <p>
              <strong className="text-fg">Every figure is rebuilt from the committed data files.</strong> Returns are
              total returns (dividends reinvested unless stated), each fund shows its latest NAV date, and funds with no
              recent NAV are excluded from rankings. Nothing here is investment advice; past numbers describe the past,
              not the future.
            </p>
          )}
          {ATTRIBUTION ? (
            <p className="mt-3">
              {ATTRIBUTION.url ? (
                <a href={ATTRIBUTION.url} target="_blank" rel="noopener noreferrer" className="underline decoration-dotted hover:text-fg">
                  {ATTRIBUTION.text}
                </a>
              ) : (
                ATTRIBUTION.text
              )}
            </p>
          ) : null}
          {!IS_DEMO && LICENSE.sourceName ? (
            <p className="mt-3">
              Source: {LICENSE.sourceName}
              {LICENSE.sourceUrl ? (
                <>
                  {" · "}
                  <a href={LICENSE.sourceUrl} target="_blank" rel="noopener noreferrer" className="underline decoration-dotted hover:text-fg">
                    visit source
                  </a>
                </>
              ) : null}
            </p>
          ) : null}
        </div>

        <p className="mt-8 text-xs text-faint">
          © {new Date().getFullYear()} Profithisab · For research only. Not investment advice. Past performance does
          not predict future results.
        </p>
      </div>
    </footer>
  );
}
