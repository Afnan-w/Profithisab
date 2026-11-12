import { politeFetch } from "./client";
import { parseDate } from "./validate";

function stripTags(s: string): string {
  return s.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
}

function cellsOf(row: string): string[] {
  const out: string[] = [];
  for (const m of row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/gi)) out.push(stripTags(m[1]));
  return out;
}

function firstNumber(text: string): number | null {
  const m = String(text).match(/-?\d+(?:,\d{3})*(?:\.\d+)?/);
  if (!m) return null;
  const n = Number(m[0].replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

export async function fetchHtml(source: { url: string; name: string }): Promise<Array<{ value: unknown; data_date: unknown; label: string | null; source_name: string; source_url: string }>> {
  const text = await politeFetch(source.url);
  const records: Array<{ value: unknown; data_date: unknown; label: string | null; source_name: string; source_url: string }> = [];

  for (const chunk of text.split(/<tr[^>]*>/gi)) {
    const end = chunk.indexOf("</tr>");
    if (end === -1) continue;
    const cells = cellsOf(chunk.slice(0, end + 5));
    if (cells.length < 2) continue;
    let data_date: string | null = null;
    let value: number | null = null;
    let label: string | null = cells[0] || null;
    for (const cell of cells) {
      if (!data_date) {
        const d = parseDate(cell);
        if (d) data_date = d;
      }
      if (value === null) {
        const n = firstNumber(cell);
        if (n !== null) value = n;
      }
    }
    if (data_date && value !== null) {
      records.push({ value, data_date, label, source_name: source.name, source_url: source.url });
    }
  }

  if (records.length === 0) {
    const flat = stripTags(text);
    const seen = new Set<string>();
    for (const m of flat.matchAll(/\d{4}-\d{2}-\d{2}/g)) {
      const d = m[0];
      if (seen.has(d)) continue;
      seen.add(d);
      const window = flat.slice(Math.max(0, m.index - 60), m.index + 60);
      const n = firstNumber(window);
      if (n !== null) records.push({ value: n, data_date: d, label: null, source_name: source.name, source_url: source.url });
    }
  }

  return records;
}
