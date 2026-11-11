import type { Metadata } from "next";
import Link from "next/link";
import { IS_DEMO, LICENSE, META, STATS } from "@/lib/returns";
import { pageMeta } from "@/lib/seo";
import { fullDate } from "@/lib/format";

export const metadata: Metadata = pageMeta({
  title: "About Profithisab — the returns site that shows its work",
  description:
    "Why Profithisab exists: Bangladeshi mutual funds are marketed on hope and evaluated on vibes. We rebuild NAV history from committed data files so every claim is checkable — and every gap is labelled.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 pt-10 sm:px-6">
      <nav aria-label="Breadcrumb" className="mb-3 text-xs text-muted">
        <Link href="/" className="hover:text-fg">Home</Link> → <span className="text-fg">About</span>
      </nav>

      <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">Profithisab — লাভ কতো?</h1>
      <p className="mt-3 text-lg leading-relaxed text-muted">
        In Bangla, the name is the product: <span className="font-medium text-fg">&ldquo;how much did you make?&rdquo;</span>{" "}
        Not &ldquo;what could you make if a star analyst nodded at your SIP.&rdquo; What <em>did</em> happen — to your
        money, in that fund, over those exact months, with dividends handled explicitly.
      </p>

      <div className="mt-8 space-y-8">
        <section>
          <h2 className="text-xl font-semibold">Why we built it</h2>
          <p className="mt-2 leading-7 text-fg-soft">
            Bangladesh has many open-end mutual funds. They publish NAVs, declare dividends and charge fees — but
            almost nobody compares them honestly. Marketing tables cherry-pick windows; social media recycles the same
            three fund names as folklore; the arithmetic of total return stays in spreadsheets no retail investor opens.
          </p>
          <p className="mt-2 leading-7 text-fg-soft">
            Profithisab is a small, stubborn answer: replay the NAV and dividend history through the same scoreboard,
            show the recipe next to every number, and let the comparison be brutal — including against the government
            certificate every fund quietly competes with.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">What this build contains</h2>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 leading-7 text-fg-soft">
            <li>
              <strong>{STATS.funds} funds</strong> from {STATS.amcs} asset managers — {STATS.withNav} with NAV history,
              {" "}{STATS.complete} with complete records. Latest NAV: {fullDate(META.latestNavDate)}.
            </li>
            <li>1/3/5-year and since-launch total returns, SIP (money-weighted) replays, worst NAV falls, fees and benchmark gaps — where the data supports them.</li>
            <li>A shareable calculator, a sortable 2–4 fund comparison, a data-driven leaderboard, and guides written for Bangladeshi specifics.</li>
            <li>
              A methodology page that refuses the phrase &ldquo;proprietary scoring.&rdquo; Everything is a published-NAV
              calculation, and every fund has a{" "}
              <Link className="underline decoration-dotted hover:text-fg" href="/data-status">data-status row</Link>.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold">How we make money (so you can judge our incentives)</h2>
          <p className="mt-2 leading-7 text-fg-soft">
            Partners — investing apps, brokers, banks — may pay a <strong>referral fee</strong> when you invest through
            them after starting here. They <strong>never</strong> pay for rankings or a single digit in the tables. If
            that arrangement ever changes, this paragraph will say so. Research stays free and ungatekept.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">The dataset, honestly described</h2>
          <div className={`mt-2 rounded-xl border p-4 text-sm leading-7 ${IS_DEMO ? "border-amber-200 bg-amber-50 dark:border-amber-900 dark:bg-amber-950/40" : "border-line bg-raised"}`}>
            {IS_DEMO ? (
              <>
                <p>
                  <strong>This launch build is running on demo data.</strong> The fund names, fees, sizes and dates come
                  from the old layout-testing dataset; the NAV paths were generated to reproduce its anchors. They are
                  not published fund history. Every page carries a &ldquo;Demo data&rdquo; banner.
                </p>
                <p className="mt-2">
                  The importer is built and waits for a licensed export. A real import needs{" "}
                  <code>data/license.json</code> to record who gave permission, what it covers and the exact
                  attribution wording. Until then, the honest label is demo.
                </p>
              </>
            ) : (
              <p>
                This build is serving imported data. {STATS.complete} funds have complete records, {STATS.partial} are
                partial and {STATS.missing} have no NAV. {STATS.stale} are stale and excluded from rankings. The source
                recorded in the licence file is <strong>{LICENSE.sourceName || "not named"}</strong>. Full status is on{" "}
                <Link className="underline decoration-dotted hover:text-fg" href="/data-status">data status</Link>.
              </p>
            )}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-semibold">What we are not</h2>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 leading-7 text-fg-soft">
            <li>Not investment advisors — nothing here is advice. Bangladesh&apos;s BSEC regime does not need another unlicensed advisor, and neither do you.</li>
            <li>Not a fund seller. We do not host applications, hold money, or see your account.</li>
            <li>Not optimists. If the honest number is below the certificate, that is what appears.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold">Say something</h2>
          <p className="mt-2 leading-7 text-fg-soft">
            Spot a number that looks wrong? That is the account for it:{" "}
            <a className="underline decoration-dotted hover:text-fg" href={`mailto:${LICENSE.contact || "data@profithisab.com"}`}>
              {LICENSE.contact || "data@profithisab.com"}
            </a>
            . Every correction makes the scoreboard cleaner for the next reader.
          </p>
        </section>
      </div>
      <p className="mt-10 pb-14 text-xs text-faint">
        Data last generated {fullDate(META.lastUpdated)} · latest NAV {fullDate(META.latestNavDate)} ·{" "}
        {STATS.funds} funds in this build.
      </p>
    </div>
  );
}
