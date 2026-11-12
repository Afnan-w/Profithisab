import Link from "next/link";
import { SiteLogo } from "@/components/site/logo";
import { ThemeToggle } from "@/components/site/theme-toggle";
import { META } from "@/lib/returns";
import { fullDate } from "@/lib/format";

const NAV = [
  { href: "/funds", label: "Funds" },
  { href: "/compare", label: "Compare" },
  { href: "/hub", label: "Data Hub" },
  { href: "/guides", label: "Learn" },
  { href: "/methodology", label: "Methodology" },
  { href: "/data-status", label: "Data status" },
];

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/60 backdrop-blur-md supports-[backdrop-filter]:bg-[color-mix(in_srgb,var(--bg)_80%,transparent)]">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-3 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-semibold tracking-tight" aria-label="Profithisab home">
          <SiteLogo className="h-6 w-6" />
          <span className="text-[15px] font-bold tracking-tight">Profithisab</span>
          <span className="hidden text-[11px] font-normal text-muted sm:inline">মিউচ্যুয়াল ফੰਡ রিটার্ন</span>
        </Link>
        <nav className="ml-auto hidden items-center gap-1 md:flex" aria-label="Primary">
          {NAV.map((n) => (
            <Link
              key={n.href}
              href={n.href}
              className="rounded-lg px-3 py-1.5 text-sm text-muted transition hover:bg-raised hover:text-fg"
            >
              {n.label}
            </Link>
          ))}
        </nav>
        <details className="group relative ml-auto md:hidden">
          <summary className="list-none cursor-pointer select-none rounded-lg border border-line px-2.5 py-1.5 text-sm" aria-label="Open menu">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </summary>
          <div className="absolute right-0 mt-2 w-48 rounded-xl border border-line bg-surface p-1.5 shadow-xl">
            {NAV.map((n) => (
              <Link key={n.href} href={n.href} className="block rounded-lg px-3 py-2 text-sm hover:bg-raised">
                {n.label}
              </Link>
            ))}
          </div>
        </details>
        <div className="hidden shrink-0 items-center gap-2 md:flex">
          <Link
            href="/data-status"
            className="hidden text-[11px] font-medium text-faint hover:text-fg lg:block"
            title={`Data updated ${fullDate(META.lastUpdated)} · Latest NAV ${fullDate(META.latestNavDate)}`}
          >
            Updated {fullDate(META.lastUpdated)} · NAV {fullDate(META.latestNavDate)}
          </Link>
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
