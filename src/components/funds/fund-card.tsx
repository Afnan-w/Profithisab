import Link from "next/link";
import { QualityBadge, TypeBadge } from "@/components/ui/badge";
import { Spark } from "@/components/charts/line-chart";
import { metricsFor, sparkPath } from "@/lib/returns";
import { cr, pct, fullDate, NOT_ENOUGH_HISTORY, NOT_AVAILABLE } from "@/lib/format";
import type { Fund } from "@/lib/types";

export function FundCard({ fund }: { fund: Fund }) {
  const m = metricsFor(fund.slug);
  const has3y = m.g3 !== null;
  const headline = has3y ? m.g3 : m.gMax;
  const d = fund.series.length >= 2 ? sparkPath(fund.slug) : "";

  return (
    <article className="card card-pad flex flex-col justify-between transition hover:border-brand-500/50 hover:shadow-md group">
      <Link href={`/funds/${fund.slug}`} className="group block">
        <div className="flex items-start justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <TypeBadge type={fund.type} shariah={fund.shariah} />
            <QualityBadge completeness={fund.completeness} stale={fund.isStale} />
          </div>
          <span className="hidden text-[10px] uppercase tracking-wide text-faint sm:block">{fund.acronym}</span>
        </div>
        <h3 className="mt-2 font-semibold leading-snug tracking-tight group-hover:text-brand-700 dark:group-hover:text-brand-400 transition-colors">
          {fund.name}
        </h3>
        <p className="mt-0.5 text-xs text-muted">{fund.amc}</p>

        <div className="mt-5 flex items-end justify-between gap-2">
          <div>
            <p className={`text-2xl font-bold tnum ${has3y ? "text-brand-600 dark:text-brand-400" : "text-fg"}`}>
              {headline === null ? "—" : pct(headline)}
            </p>
            <p className="mt-0.5 text-[11px] text-muted">
              {has3y
                ? "per year · 3-year total return"
                : headline !== null
                  ? `per year since ${fund.inception ? fullDate(`${fund.inception}-01`) : "launch"}`
                  : NOT_ENOUGH_HISTORY}
            </p>
          </div>
          {d ? <Spark path={d} /> : <span className="text-[10px] text-faint">{NOT_AVAILABLE}</span>}
        </div>

        <div className="mt-4 grid grid-cols-3 gap-3 border-t border-line pt-3 text-[11px] text-muted">
          <span>
            Worst fall{" "}
            <span className="tnum font-semibold text-fg">
              {m.rows > 2 ? pct(m.worstFall, { signed: false }) : NOT_AVAILABLE}
            </span>
          </span>
          <span>
            Size <span className="tnum font-semibold text-fg">{fund.fundSize === null ? "—" : cr(fund.fundSize)}</span>
          </span>
          <span>
            Fee <span className="tnum font-semibold text-fg">{fund.fee === null ? "—" : `${fund.fee.toFixed(2)}%`}</span>
          </span>
        </div>
      </Link>
      <p className="mt-3 flex items-center justify-between gap-2 text-[10px] text-faint">
        <span>Latest NAV {fullDate(fund.latestNavDate)}</span>
        {fund.source.url ? (
          <a
            href={fund.source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-dotted hover:text-fg"
            title={fund.source.name}
          >
            Source ↗
          </a>
        ) : (
          <span className="truncate" title={fund.source.name}>
            {fund.source.kind === "demo" ? "Demo source" : fund.source.name}
          </span>
        )}
      </p>
    </article>
  );
}
