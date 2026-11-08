import type { Metadata } from "next";
import Link from "next/link";
import { pageMeta } from "@/lib/seo";

export const metadata: Metadata = pageMeta({
  title: "Invest with our partners — when the numbers convince you",
  description:
    "You've seen the history; here's how units actually get bought in Bangladesh — via the AMC, an authorised agent or an investing app. Transparent partner list, referral-fee disclosure up front.",
  path: "/invest",
});

export default function InvestPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 pt-10 sm:px-6">
      <nav aria-label="Breadcrumb" className="mb-3 text-xs text-muted">
        <Link href="/" className="hover:text-fg">Home</Link> → <span className="text-fg">Invest</span>
      </nav>

      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Invest — after the numbers, not before</h1>
      <p className="mt-3 text-lg leading-relaxed text-muted">
        Profithisab is the research floor, not the sales counter. When a fund&apos;s history (and your risk budget)
        convinces you, units are bought directly from the asset manager, an authorised selling agent, or an
        investing app. Three honest routes below.
      </p>

      <div className="mt-8 grid gap-4">
        <section className="card card-pad">
          <h2 className="text-lg font-semibold">1. Straight from the AMC</h2>
          <p className="mt-1.5 text-sm leading-7 text-fg-soft">
            The most traditional route and for most open-end funds the default: fill the fund&apos;s application,
            complete KYC (NID, photo, bank details), pay into the designated account. Fees to you: whatever the
            prospectus charges — we list each fund&apos;s fee on its page.
          </p>
        </section>
        <section className="card card-pad">
          <h2 className="text-lg font-semibold">2. Authorised agents</h2>
          <p className="mt-1.5 text-sm leading-7 text-fg-soft">
            Bank branches and licensed agents can process applications for participating funds. Useful when you
            want counters and stamps rather than PDFs.
          </p>
        </section>
        <section className="card card-pad">
          <h2 className="text-lg font-semibold">3. Investing apps &amp; broker platforms <span className="chip !py-0">Partners: onboarding in progress</span></h2>
          <p className="mt-1.5 text-sm leading-7 text-fg-soft">
            For digital application flows, standing SIP instructions and portfolio dashboards in one place. We
            are onboarding launch partners and listing them here only as agreements conclude — each carries a
            clear disclosure; none can pay to appear earlier in any ranking on this site.
          </p>
        </section>
      </div>

      <section className="card card-pad mt-8 border-brand-200 bg-brand-50 dark:border-brand-900 dark:bg-brand-950/40">
        <h2 className="text-lg font-semibold">Our referral-fee rule, in one paragraph</h2>
        <p className="mt-1.5 text-sm leading-7">
          Partners may pay Profithisab a referral fee for successful signups/sales. They never pay for rankings,
          returns, badges, or table placement — the order of funds on every page is set by the same published
          NAV arithmetic for everyone, partners included. If a partner ever disputes that rule, they self-select
          out. That is the entire policy.
        </p>
      </section>

      <section className="mt-8">
        <h2 className="text-xl font-semibold">Before you buy anything</h2>
        <ul className="mt-2 list-disc space-y-1.5 pl-5 leading-7 text-fg-soft">
          <li>Re-run your amount in the <Link className="underline decoration-dotted hover:text-fg" href="/">homepage calculator</Link> — including a drawdown year, not just a good one.</li>
          <li>Read the <Link className="underline decoration-dotted hover:text-fg" href="/guides/how-to-invest-in-mutual-funds-in-bangladesh">step-by-step guide</Link> for KYC and SIP mechanics.</li>
          <li>Check fees and exit rules on the fund&apos;s page — the boring rows that decide the decade.</li>
        </ul>
      </section>
      <p className="mt-10 pb-14 text-xs text-faint">
        Buying units happens with AMCs/agents/apps — never on Profithisab. We hold no client money and run no
        accounts.
      </p>
    </div>
  );
}
