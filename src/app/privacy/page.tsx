import type { Metadata } from "next";
import { pageMeta } from "@/lib/seo";
import { site } from "@/lib/site";
import { fullDate } from "@/lib/format";
import { META } from "@/lib/returns";

export const metadata: Metadata = pageMeta({
  title: "Privacy — what Profithisab collects (almost nothing)",
  description: "Profithisab stores no personal accounts: no logins, no cookies for tracking, no sold data. Analytics are aggregate and privacy-respecting. The full plain-language policy.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 pt-10 sm:px-6">
      <nav aria-label="Breadcrumb" className="mb-3 text-xs text-muted">
        <a href="/" className="hover:text-fg">Home</a> → <span className="text-fg">Privacy</span>
      </nav>

      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Privacy, in plain words</h1>
      <p className="mt-3 leading-7 text-fg-soft">
        You don&apos;t need an account for anything on {site.name}, so we try to need nothing from you:
      </p>
      <ul className="mt-4 list-disc space-y-2 pl-5 leading-7 text-fg-soft">
        <li><strong>No user accounts.</strong> There is nothing to sign into, so there is nothing to leak.</li>
        <li><strong>No tracking cookies by us.</strong> Your theme preference lives in your browser&apos;s local storage.</li>
        <li><strong>Aggregate analytics.</strong> If enabled, traffic analytics (e.g. Plausible) count pageviews without collecting personal identifiers or fingerprinting.</li>
        <li><strong>Share links.</strong> Calculator and compare selections live in the URL. They are not sent to us or stored on a server.</li>
        <li><strong>Email.</strong> If you write to us, we use your email to reply, not to list you into anything.</li>
        <li><strong>No money, ever.</strong> We never take payments or hold client funds, so we don&apos;t ask for financial details.</li>
      </ul>
      <p className="mt-6 leading-7 text-fg-soft">
        Data corrections: <a className="underline decoration-dotted hover:text-fg" href={`mailto:${site.contactEmail}`}>{site.contactEmail}</a>. Last data
        refresh referenced here: {fullDate(META.lastUpdated)}.
      </p>
    </div>
  );
}
