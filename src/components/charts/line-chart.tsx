import { linePath } from "@/lib/returns";
import { monthLabel } from "@/lib/format";

export interface ChartSeries {
  name: string;
  values: number[];
  color: string;
  dashed?: boolean;
  area?: boolean;
}

/** Server-rendered multi-line chart: works without JavaScript, zero CLS. */
export function MultiLineChart({
  series,
  labels,
  height = 260,
  formatTick,
  title,
  note,
  compact = false,
}: {
  series: ChartSeries[];
  labels: string[]; // month keys, same length as every series' values
  height?: number;
  formatTick: (v: number) => string;
  title?: string;
  note?: string;
  compact?: boolean;
}) {
  const W = compact ? 560 : 720;
  const H = height;
  const padL = 10;
  const padR = 64;
  const padT = 14;
  const padB = 26;
  const n = labels.length;

  const all = series.flatMap((s) => s.values);
  if (!all.length || n < 2) return null;
  const min = Math.min(...all);
  const max = Math.max(...all);
  const yMin = min - (max - min) * 0.06 || 0;
  const yMax = max + (max - min) * 0.06 || 1;

  const xOf = (i: number) => padL + (i * (W - padL - padR)) / (n - 1);
  const yOf = (v: number) => H - padB - ((v - yMin) / (yMax - yMin)) * (H - padT - padB);

  const firstLabel = monthLabel(labels[0]);
  const lastLabel = monthLabel(labels[n - 1]);

  return (
    <figure className="w-full">
      {title ? <figcaption className="mb-2 text-sm font-medium text-muted">{title}</figcaption> : null}
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={title ?? "Chart"}>
        {/* y grid */}
        <line x1={padL} y1={yOf(yMax)} x2={W - padR} y2={yOf(yMax)} stroke="var(--line)" strokeWidth="1" />
        <line x1={padL} y1={yOf(yMin)} x2={W - padR} y2={yOf(yMin)} stroke="var(--line)" strokeWidth="1" />
        {series.map((s, si) => {
          const d = linePath(s.values, W - padL - padR, H - padT - padB);
          if (!d) return null;
          // linePath starts at (pad, padY); shift by transform
          return (
            <g key={s.name}>
              <g transform={`translate(${padL - 2}, ${padT - 2})`}>
                {s.area ? (
                  <path
                    d={`${d} L${(W - padL - padR).toFixed(1)} ${(H - padT - padB).toFixed(1)} L2 ${(H - padT - padB).toFixed(1)} Z`}
                    fill={s.color}
                    opacity="0.08"
                  />
                ) : null}
                <path
                  d={d}
                  fill="none"
                  stroke={s.color}
                  strokeWidth="2.4"
                  strokeLinejoin="round"
                  strokeLinecap="round"
                  strokeDasharray={s.dashed ? "5 5" : undefined}
                />
              </g>
              {/* end-of-line value pill */}
              <text
                x={W - padR + 6}
                y={yOf(s.values[n - 1]) + 3.5}
                fontSize="10.5"
                fill={s.color}
                className="tnum"
              >
                {formatTick(s.values[n - 1])}
              </text>
            </g>
          );
        })}
        {/* x labels */}
        <text x={padL} y={H - 8} fontSize="10.5" fill="var(--faint)">
          {firstLabel}
        </text>
        <text x={W - padR} y={H - 8} fontSize="10.5" fill="var(--faint)" textAnchor="end">
          {lastLabel}
        </text>
        {/* y labels */}
        <text x={padL} y={padT + 2} fontSize="10.5" fill="var(--faint)" className="tnum">
          {formatTick(yMax)}
        </text>
        <text x={padL} y={H - padB - 2} fontSize="10.5" fill="var(--faint)" className="tnum">
          {formatTick(yMin)}
        </text>
      </svg>
      {series.length > 1 || note ? (
        <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted">
          {series.map((s) => (
            <span key={s.name} className="inline-flex items-center gap-1.5">
              <span
                aria-hidden="true"
                className="inline-block h-0.5 w-4 rounded"
                style={{ background: s.color, opacity: s.dashed ? 0.6 : 1 }}
              />
              {s.name}
            </span>
          ))}
          {note ? <span>· {note}</span> : null}
        </div>
      ) : null}
    </figure>
  );
}

/** Tiny inline sparkline (path string precomputed server-side). */
export function Spark({ path, w = 96, h = 30, color = "#059669" }: { path: string; w?: number; h?: number; color?: string }) {
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} className="inline-block" aria-hidden="true">
      <path d={path} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
