import Link from "next/link";
import { TypeBadge, VerifiedBadge } from "@/components/ui/badge";
import { Spark } from "@/components/charts/line-chart";
import { metricsFor, sparkPath } from "@/lib/returns";
import { cr, pct, longDate } from "@/lib/format";
import type { Fund } from "@/lib/types";

export function FundCard({ fund }: { fund: Fund }) {
  const m = metricsFor(fund.slug);
  const d = sparkPath(fund.slug);
  const has3y = m.g3 !== null;
  return (
    <Link
      href={`/funds/${fund.slug}`}
      className="card card-pad group flex flex-col justify-between transition hover:border-brand-500"
    >
      <div>
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <TypeBadge type={fund.type} shariah={fund.shariah} />
            {fund.verified ? <VerifiedBadge /> : null}
          </div>
          <span className="hidden text-[10px] uppercase tracking-wide text-faint sm:block">{fund.acronym}</span>
        </div>
        <h3 className="mt-2 font-semibold leading-snug tracking-tight group-hover:text-brand-700 dark:group-hover:text-brand-300">
          {fund.name}
        </h3>
        <p className="mt-0.5 text-xs text-muted">{fund.amc}</p>
      </div>

      <div className="mt-4 flex items-end justify-between gap-2">
        <div>
          <p className={`text-2xl font-bold tnum ${has3y ? "text-brand-600 dark:text-brand-400" : "text-fg"}`}>
            {has3y ? pct(m.g3) : pct(m.gMax ?? 0)}
          </p>
          <p className="text-[11px] text-muted">
            {has3y ? "per year · one-time, last 3 years" : `per year since ${longDate(fund.inception)}`}
          </p>
        </div>
        <Spark path={d} />
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 border-t border-line pt-3 text-[11px] text-muted">
        <span>Worst fall <span className="tnum font-semibold text-fg">{pct(m.worstFall, { signed: false })}</span></span>
        <span>Size <span className="tnum font-semibold text-fg">{cr(fund.aumCr)}</span></span>
        <span>Fee <span className="tnum font-semibold text-fg">{fund.fee.toFixed(2)}%</span></span>
      </div>
    </Link>
  );
}
