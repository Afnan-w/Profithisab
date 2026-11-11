import Link from "next/link";
import { IS_DEMO, META } from "@/lib/returns";
import { fullDate } from "@/lib/format";

/**
 * Always-visible honesty strip. It is impossible to miss on purpose: the site
 * must never look like it is publishing real NAVs when it is not.
 */
export function DataBanner() {
  if (IS_DEMO) {
    return (
      <div role="status" className="border-b border-amber-300 bg-amber-100 text-amber-950 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2 text-xs sm:px-6">
          <strong className="rounded bg-amber-900 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-amber-50 dark:bg-amber-200 dark:text-amber-950">
            Demo data
          </strong>
          <span className="font-medium">
            These NAV histories are generated for layout testing — not published fund data. Do not use them for investment decisions.
          </span>
          <Link href="/data-status" className="underline decoration-dotted underline-offset-2 hover:no-underline">
            Details →
          </Link>
        </div>
      </div>
    );
  }

  if (META.counts.stale > 0) {
    return (
      <div role="status" className="border-b border-amber-300 bg-amber-50 text-amber-950 dark:border-amber-800 dark:bg-amber-950/60 dark:text-amber-100">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2 text-xs sm:px-6">
          <strong>Heads up:</strong>
          <span>
            {META.counts.stale} fund{META.counts.stale === 1 ? "" : "s"} have no published NAV in the last 30 days. They are
            marked and excluded from rankings.
          </span>
          <Link href="/data-status" className="underline decoration-dotted underline-offset-2 hover:no-underline">
            See which →
          </Link>
        </div>
      </div>
    );
  }

  return null;
}

export function DataFreshness() {
  if (!META.latestNavDate) return null;
  return (
    <span className="text-[11px] text-faint">
      Data updated {fullDate(META.lastUpdated)} · Latest NAV {fullDate(META.latestNavDate)}
    </span>
  );
}
