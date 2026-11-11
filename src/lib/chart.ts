/** SVG path helper — client-safe (no filesystem imports). */

export function linePath(values: number[], w: number, h: number): string {
  if (values.length < 2) return "";
  const finite = values.filter((v) => Number.isFinite(v));
  if (finite.length < 2) return "";
  const min = Math.min(...finite);
  const max = Math.max(...finite);
  const pad = 2;
  const span = max - min || 1;
  const step = (w - pad * 2) / (values.length - 1);
  let d = "";
  for (let i = 0; i < values.length; i++) {
    const x = (pad + i * step).toFixed(1);
    const y = (h - pad - ((values[i] - min) / span) * (h - pad * 2)).toFixed(1);
    d += `${i === 0 ? "M" : "L"}${x} ${y} `;
  }
  return d.trim();
}
