/**
 * Horizontal ranked bars with an optional benchmark threshold line.
 * Values are already percentages (12.4 = 12.4% a year). Server-rendered,
 * no JavaScript, no layout shift.
 */
export function RankedBars({
  items,
  benchmark,
  benchmarkLabel,
  emptyText = "Not enough history to rank funds yet.",
}: {
  items: Array<{ label: string; href?: string; value: number; color?: string; sub?: string }>;
  benchmark?: number | null;
  benchmarkLabel?: string;
  emptyText?: string;
}) {
  if (!items.length) {
    return <p className="rounded-xl border border-line bg-raised p-4 text-sm text-muted">{emptyText}</p>;
  }

  const values = items.map((i) => i.value).concat(benchmark ?? []);
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const span = max - min || 1;
  const widthOf = (v: number) => `${Math.max(2, ((v - min) / span) * 100)}%`;
  const leftOf = (v: number) => `${Math.max(0, Math.min(100, ((v - min) / span) * 100))}%`;

  return (
    <div>
      <ol className="space-y-2">
        {items.map((it, i) => (
          <li key={`${it.label}-${i}`} className="grid grid-cols-[1.4rem_minmax(0,1fr)_auto] items-center gap-2 text-xs sm:grid-cols-[1.4rem_12rem_minmax(0,1fr)_auto]">
            <span className="text-right text-faint tnum">{i + 1}</span>
            <span className="min-w-0">
              {it.href ? (
                <a href={it.href} className="block truncate font-medium hover:text-brand-700 dark:hover:text-brand-300">
                  {it.label}
                </a>
              ) : (
                <span className="block truncate font-medium">{it.label}</span>
              )}
              {it.sub ? <span className="block truncate text-[10px] text-faint">{it.sub}</span> : null}
            </span>
            <span className="relative hidden h-2.5 overflow-hidden rounded-full bg-raised sm:block">
              <span
                className="absolute inset-y-0 left-0 rounded-full"
                style={{ width: widthOf(it.value), background: it.color ?? "#059669" }}
              />
            </span>
            <span className="w-16 shrink-0 text-right font-semibold tnum">
              {it.value >= 0 ? "+" : ""}
              {it.value.toFixed(1)}%
            </span>
          </li>
        ))}
      </ol>
      {benchmark !== undefined && benchmark !== null ? (
        <div className="relative mt-3 hidden h-4 sm:block" aria-hidden="true">
          <span
            className="absolute top-0 h-4 border-l border-dashed border-slate-400 dark:border-slate-500"
            style={{ left: leftOf(benchmark) }}
          />
          <span
            className="absolute top-0 -translate-x-1/2 whitespace-nowrap bg-surface px-1 text-[10px] text-faint"
            style={{ left: leftOf(benchmark) }}
          >
            {benchmarkLabel ?? `Benchmark ${benchmark.toFixed(1)}%`}
          </span>
        </div>
      ) : null}
    </div>
  );
}
