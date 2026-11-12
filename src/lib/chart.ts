/** SVG path helper — client-safe (no filesystem imports). */

/**
 * Maps values to an SVG polyline. `null` entries are months with no data: they
 * are skipped and the line restarts after the gap, so a benchmark trail that
 * begins later than the fund still lines up on the same month grid.
 */
export function linePath(values: Array<number | null>, w: number, h: number): string {
  const n = values.length;
  const finite = values.filter((v): v is number => v !== null && Number.isFinite(v));
  if (n < 2 || finite.length < 2) return "";
  const min = Math.min(...finite);
  const max = Math.max(...finite);
  const pad = 2;
  const span = max - min || 1;
  const step = (w - pad * 2) / (n - 1);
  let d = "";
  let broken = true;
  for (let i = 0; i < n; i++) {
    const v = values[i];
    if (v === null || !Number.isFinite(v)) {
      broken = true;
      continue;
    }
    const x = pad + i * step;
    const y = h - pad - ((v - min) / span) * (h - pad * 2);
    d += `${broken ? "M" : "L"}${x.toFixed(1)} ${y.toFixed(1)} `;
    broken = false;
  }
  return d.trim();
}
