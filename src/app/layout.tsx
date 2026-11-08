import type { Metadata, Viewport } from "next";
import { Inter, Noto_Sans_Bengali } from "next/font/google";
import { ThemeProvider } from "next-themes";
import Script from "next/script";
import { SiteHeader } from "@/components/site/header";
import { SiteFooter } from "@/components/site/footer";
import { site } from "@/lib/site";
import { JsonLd } from "@/components/seo/jsonld";
import { orgSchema, websiteSchema } from "@/lib/seo";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

const bengali = Noto_Sans_Bengali({
  subsets: ["bengali"],
  weight: ["400", "600"],
  variable: "--font-bn",
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: `Profithisab | ${site.tagline.replace(/^\w/, (c) => c.toUpperCase())}`,
    template: "%s | Profithisab",
  },
  description: site.description,
  keywords: [
    "mutual fund returns bangladesh",
    "open end mutual fund Bangladesh",
    "SIP calculator Bangladesh",
    "Shariah mutual funds Bangladesh",
    "best mutual funds Bangladesh",
    "Sanchayapatra vs mutual fund",
  ],
  authors: [{ name: "Profithisab" }],
  openGraph: {
    type: "website",
    siteName: "Profithisab",
    locale: "en_BD",
    url: site.url,
    title: `Profithisab | ${site.tagline}`,
    description: site.description,
  },
  twitter: { card: "summary_large_image", site: site.twitter },
  robots: { index: true, follow: true },
  alternates: { canonical: "./" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f7faf9" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0f0d" },
  ],
  width: "device-width",
  initialScale: 1,
};

const themeScript = `(function(){try{var t=localStorage.getItem("theme")||"system";if(t==="dark"||(t==="system"&&matchMedia("(prefers-color-scheme: dark)").matches)){document.documentElement.classList.add("dark")}}catch(e){}})()`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* no-flash theme boot */}
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className={`${inter.variable} ${bengali.variable} font-sans antialiased min-h-dvh flex flex-col`}>
        <ThemeProvider>
          <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-2 focus:rounded-lg focus:bg-brand-600 focus:px-3 focus:py-2 focus:text-white">
            Skip to main content
          </a>
          <SiteHeader />
          <main id="main" className="flex-1">
            {children}
          </main>
          <SiteFooter />
        </ThemeProvider>
        {/* Aggregate, cookie-free analytics — only active when a domain is set at build time. */}
        {process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN ? (
          <Script
            defer
            data-domain={process.env.NEXT_PUBLIC_PLAUSIBLE_DOMAIN}
            src="https://plausible.io/js/script.js"
            strategy="afterInteractive"
          />
        ) : null}
        <JsonLd objects={[orgSchema(), websiteSchema()]} />
      </body>
    </html>
  );
}
