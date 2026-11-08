import Link from "next/link";
import { site } from "@/lib/site";

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 md:grid-cols-4">
          <div className="md:col-span-2">
            <p className="font-semibold">Profithisab</p>
            <p className="mt-1 max-w-sm text-sm text-muted">
              Real returns of Bangladeshi mutual funds, replayed from published NAV history. Free, no
              login, no sales talk.
            </p>
          </div>
          <nav aria-label="Footer tools">
            <p className="text-sm font-semibold">Tools</p>
            <ul className="mt-2 space-y-1.5 text-sm text-muted">
              <li><a className="hover:text-fg" href="/">Calculator</a></li>
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
              <li><Link href="/about" className="hover:text-fg">About</Link></li>
              <li><Link href="/invest" className="hover:text-fg">Invest with our partners</Link></li>
              <li><Link href="/privacy" className="hover:text-fg">Privacy</Link></li>
            </ul>
          </nav>
        </div>
        <div className="mt-10 rounded-xl border border-line bg-raised p-4 text-xs leading-relaxed text-muted">
          <strong className="text-fg">Honest-figures note.</strong> Every headline on this site is rebuilt
          the same way for every fund — one fixed 3-year window, dividends reinvested, published NAVs only.
          This launch build ships with an <Link href="/methodology#data-status" className="underline decoration-dotted hover:text-fg">anchored demo dataset</Link>;
          swap in the full NAV series via the documented pipeline to run on verbatim data. Nothing here is
          investment advice; past numbers describe the past, not the future.
        </div>
        <p className="mt-6 text-xs text-faint">© {new Date().getFullYear()} Profithisab · For research. Not investment advice.</p>
      </div>
    </footer>
  );
}
