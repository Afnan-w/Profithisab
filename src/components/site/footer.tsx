import Link from "next/link";
import { ATTRIBUTION, IS_DEMO, LICENSE, META } from "@/lib/returns";
import { fullDate } from "@/lib/format";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <p className="font-semibold">Profithisab</p>
            <p className="mt-1 max-w-sm text-sm text-muted">
              Real returns of Bangladeshi mutual funds, replayed from the NAV and dividend history in our data files.
              Free, no login, no sales talk.
            </p>
            <p className="mt-3 text-xs text-faint">
              Data updated {fullDate(META.lastUpdated)} · Latest NAV {fullDate(META.latestNavDate)} ·{" "}
              <Link href="/data-status" className="underline decoration-dotted hover:text-fg">per-fund data status</Link>
            </p>
          </div>
          <nav aria-label="Footer tools">
            <p className="text-sm font-semibold">Tools</p>
            <ul className="mt-2 space-y-1.5 text-sm text-muted">
              <li><Link className="hover:text-fg" href="/">Calculator</Link></li>
              <li><Link href="/funds" className="hover:text-fg">Funds</Link></li>
              <li><Link href="/compare" className="hover:text-fg">Compare</Link></li>
              <li><Link href="/guides/best-mutual-funds-bangladesh" className="hover:text-fg">Best funds, 3-year</Link></li>
            </ul>
          </nav>
          <nav aria-label="Footer learn">
            <p className="text-sm font-semibold">Learn</p>
            <ul className="mt-2 space-y-1.5 text-sm text-muted">
              <li><Link href="/guides" className="hover:text-fg">Guides</Link></li>
              <li><Link href="/methodology" className="hover:text-fg">Methodology</Link></li>
              <li><Link href="/data-status" className="hover:text-fg">Data status</Link></li>
              <li><Link href="/about" className="hover:text-fg">About</Link></li>
              <li><Link href="/invest" className="hover:text-fg">Invest with our partners</Link></li>
              <li><Link href="/privacy" className="hover:text-fg">Privacy</Link></li>
            </ul>
          </nav>
        </div>

        <div className="mt-10 rounded-xl border border-line bg-raised p-4 text-xs leading-relaxed text-muted">
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
            <p className="mt-2">
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
            <p className="mt-2">
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
        <p className="mt-6 text-xs text-faint">
          © {new Date().getFullYear()} Profithisab · For research only. Not investment advice. Past performance does
          not predict future results.
        </p>
      </div>
    </footer>
  );
}
