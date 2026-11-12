import { Badge } from "@/components/ui/badge";
import { dhakaDate, dhakaDateTime, delayLabel, TZ_LABEL } from "@/lib/hub/freshness";

/**
 * Provenance footnote for every hub table, chart and figure: source name,
 * data date, last fetched time (Asia/Dhaka), delay label, staleness warning,
 * sample-data badge and manual-update label. Server-rendered.
 */
export interface ProvenanceProps {
  sourceName: string;
  sourceUrl?: string | null;
  /** Date the data itself refers to (e.g. the NAV date). */
  dataDate?: string | null;
  /** When the fetch pipeline last wrote the file. */
  fetchedAt?: string | null;
  delayMinutes?: number | null;
  /** Past the expected fetch interval → "Data may be outdated". */
  stale?: boolean;
  /** Shipped with the repo so pages render before the first fetch. */
  sample?: boolean;
  /** Manual source → "manually updated on [date]". */
  manual?: boolean;
  note?: string | null;
}

export function Provenance({
  sourceName,
  sourceUrl,
  dataDate,
  fetchedAt,
  delayMinutes,
  stale = false,
  sample = false,
  manual = false,
  note,
}: ProvenanceProps) {
  const delay = delayLabel(delayMinutes);
  const fetched = dhakaDateTime(fetchedAt);
  const dataDay = dhakaDate(dataDate);

  return (
    <div className="mt-3 rounded-xl border border-line bg-raised/50 p-3 text-xs leading-relaxed text-muted">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <span>
          Source:{" "}
          {sourceUrl ? (
            <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="font-medium text-fg underline decoration-dotted hover:text-brand-700 dark:hover:text-brand-300">
              {sourceName} ↗
            </a>
          ) : (
            <span className="font-medium text-fg">{sourceName}</span>
          )}
        </span>
        {dataDay ? (
          <span>
            Data date: <time dateTime={dataDate ?? undefined} className="tnum font-medium text-fg">{dataDay}</time>
          </span>
        ) : null}
        {fetched ? (
          <span>
            Last fetched: <span className="tnum font-medium text-fg">{fetched}</span> ({TZ_LABEL})
          </span>
        ) : null}
        {sample ? <Badge tone="amber">Sample data</Badge> : null}
        {manual && dataDay ? <Badge tone="violet">manually updated on {dataDay}</Badge> : null}
        {delay ? <Badge tone="slate">{delay}</Badge> : null}
      </div>
      {stale ? (
        <p className="mt-2 rounded-lg border border-amber-300 bg-amber-50 px-2.5 py-1.5 font-medium text-amber-900 dark:border-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
          Data may be outdated — this source has not refreshed within its expected interval.
        </p>
      ) : null}
      {note ? <p className="mt-2 text-faint">{note}</p> : null}
    </div>
  );
}

/** The site-wide compliance notice, repeated on every hub page. */
export function HubNotice({ className = "" }: { className?: string }) {
  return (
    <p className={`rounded-xl border border-line bg-raised px-4 py-3 text-xs leading-relaxed text-muted ${className}`}>
      <strong className="text-fg">Information only. Not investment advice.</strong> Nothing here is a buy or sell
      recommendation. Check the fund&apos;s official prospectus before investing. Past performance does not guarantee
      future results.
    </p>
  );
}

/** Short return-figure disclaimer used under every chart, table and calculator result. */
export function PastPerformanceNote({ className = "" }: { className?: string }) {
  return (
    <p className={`text-xs leading-relaxed text-faint ${className}`}>
      Past performance does not guarantee future results. Estimates only — information, not investment advice.
    </p>
  );
}
