import type { Metadata } from "next";
import Link from "next/link";
import { ALL_FUNDS, AMCs, TOTAL_AUM_CR, VERIFIED_COUNT } from "@/lib/returns";
import { pageMeta } from "@/lib/seo";
import { site } from "@/lib/site";
import { longDate } from "@/lib/format";

export const metadata: Metadata = pageMeta({
  title: "About Profithisab — the returns site that shows its work",
  description:
    "Why Profithisab exists: Bangladeshi mutual funds are marketed on hope and evaluated on vibes. We rebuild published NAV history with one fixed window so every claim is checkable — and every figure shows its recipe.",
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
        money, in that fund, over those exact months, dividends and fees included.
      </p>

      <div className="mt-8 space-y-8">
        <section>
          <h2 className="text-xl font-semibold">Why we built it</h2>
          <p className="mt-2 leading-7 text-fg-soft">
            Bangladesh now has 100+ open-end mutual funds. They publish NAVs regularly, declare dividends
            seasonally, and charge fees continuously — but almost nobody compares them honestly. Marketing tables
            cherry-pick windows; replies on social media recycle the same three fund names as folklore; the actual
            arithmetic of total return stays in spreadsheets no retail investor opens.
          </p>
          <p className="mt-2 leading-7 text-fg-soft">
            Profithisab is a small, stubborn answer: replay published NAV and dividend history through the same
            scoreboard for every fund, show the recipe next to every number, and let the comparison be brutal —
            including against the government certificate every fund quietly competes with.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">What we publish today</h2>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 leading-7 text-fg-soft">
            <li><strong>{ALL_FUNDS.length} open-end funds</strong> from {AMCs.length} asset managers — {VERIFIED_COUNT} of them AMC-verified — replayed as of {longDate(site.asOf)}.</li>
            <li>Total return, per-year rates, SIP (money-weighted) replays, worst NAV falls, fees, and benchmark gaps for each fund.</li>
            <li>An honest calculator, a side-by-side compare tool, a data-driven leaderboard, and guides written for Bangladeshi specifics.</li>
            <li>A methodology page that refuses the phrase &ldquo;proprietary scoring.&rdquo; Everything is a published-NAV calculation.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold">How we make money (so you can judge our incentives)</h2>
          <p className="mt-2 leading-7 text-fg-soft">
            Partners — investing apps, brokers, banks — may pay a <strong>referral fee</strong> when you invest
            through them after starting here. They <strong>never</strong> pay for rankings, badges, or a single
            digit in the tables; if that arrangement ever changes, this paragraph will say so and the dataset
            will say why. Research stays free and ungatekept.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">The dataset, honestly described</h2>
          <p className="mt-2 leading-7 text-fg-soft">
            This launch build replays each fund&apos;s published anchors (3-year, since-launch, worst fall) on a
            month-by-month path — full notes in <Link className="underline decoration-dotted hover:text-fg" href="/methodology#data-status">data status</Link>.
            The swap-in of verbatim NAV series is behind a single documented pipeline; transparency about dummy
            data beats pretending you have a live feed.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-semibold">What we are not</h2>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 leading-7 text-fg-soft">
            <li>Not investment advisors — nothing here is advice. Bangladesh&apos;s BSEC regime doesn&apos;t need another unlicensed advisor, and neither do you.</li>
            <li>Not a fund seller. We don&apos;t host applications, hold money, or see your account.</li>
            <li>Not optimists. If the honest number for a fund under that certificate is below zero, that&apos;s what appears.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-semibold">Say something</h2>
          <p className="mt-2 leading-7 text-fg-soft">
            Spot a number that looks wrong? That account exists:{" "}
            <a className="underline decoration-dotted hover:text-fg" href="mailto:data@Profithisab.com">data@Profithisab.com</a>.
            Every correction makes the scoreboard cleaner for the next reader.
          </p>
        </section>
      </div>
      <p className="mt-10 pb-14 text-xs text-faint">
        Total assets across tracked funds at {longDate(site.asOf)}: {Math.round(TOTAL_AUM_CR)} crore ৳.
      </p>
    </div>
  );
}
