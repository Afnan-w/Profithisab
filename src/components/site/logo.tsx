import fs from "node:fs";
import path from "node:path";
import Link from "next/link";
import Image from "next/image";

/**
 * Main brand logo.
 *
 * Drop `mainlogo.png` into `public/` (i.e. `public/mainlogo.png`) and it is used
 * everywhere the logo appears. Until that file exists, the inline SVG mark is
 * shown — so the site never renders a broken image. The check runs at build
 * time: after adding the PNG, rebuild (or restart `npm run dev`) and then
 * commit + push.
 */
const hasMainLogo = fs.existsSync(path.join(process.cwd(), "public", "mainlogo.png"));

export function SiteLogo({ className = "h-8 w-8" }: { className?: string }) {
  if (hasMainLogo) {
    // Intrinsic 32-box keeps it crisp on retina; object-contain tolerates
    // non-square artwork without distortion.
    return (
      <Image
        src="/mainlogo.png"
        alt="Profithisab logo"
        width={32}
        height={32}
        className={`${className} object-contain`}
      />
    );
  }
  return <LogoMark className={className} />;
}

export function LogoMark({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" aria-hidden="true">
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
  );
}

export function Wordmark() {
  return (
    <Link href="/" className="flex items-center gap-2">
      <SiteLogo className="h-7 w-7" />
      <span className="text-lg font-bold tracking-tight">Profithisab</span>
    </Link>
  );
}
