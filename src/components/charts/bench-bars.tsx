export function BenchBars({
  items,
  max,
}: {
  items: Array<{ label: string; value: number; color?: string; highlight?: boolean; note?: string }>;
  max?: number;
}) {
  const top = (max ?? Math.max(...items.map((i) => i.value))) || 1;
  const scale = (v: number) =>
    v < 0 ? "0%" : `${Math.max(2, (v / top) * 100)}%`;
  return (
    <ul className="space-y-2.5">
      {items.map((it) => (
        <li key={it.label} className="flex items-center gap-3">
          <span className={`w-28 shrink-0 text-xs ${it.highlight ? "font-semibold text-fg" : "text-muted"}`}>
            {it.label}
          </span>
          <span className="relative h-2 flex-1 overflow-hidden rounded-full bg-raised">
            <span
              className="absolute inset-y-0 left-0 rounded-full"
              style={{
                width: scale(it.value),
                background: it.color ?? (it.highlight ? "#059669" : "#64748b"),
              }}
            />
          </span>
          <span className={`w-14 shrink-0 text-right text-xs tnum ${it.highlight ? "font-semibold text-fg" : "text-muted"}`}>
            {it.value >= 0 ? "+" : "-"}{Math.abs(it.value).toFixed(1)}%
          </span>
        </li>
      ))}
    </ul>
  );
}
