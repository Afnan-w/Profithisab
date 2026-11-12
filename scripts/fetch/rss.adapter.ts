import { politeFetch } from "./client";
import { parseDate } from "./validate";

function extract(text: string, tag: string): string | null {
  const m = text.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return m ? m[1].replace(/<[^>]*>/g, "").trim() : null;
}

function firstNumber(text: string): number | null {
  const m = String(text).match(/-?\d+(?:,\d{3})*(?:\.\d+)?/);
  if (!m) return null;
  const n = Number(m[0].replace(/,/g, ""));
  return Number.isFinite(n) ? n : null;
}

export async function fetchRss(source: { url: string; name: string }): Promise<Array<{ value: unknown; data_date: unknown; label: string | null; source_name: string; source_url: string }>> {
  const text = await politeFetch(source.url);
  const items: Array<string> = [];
  for (const m of text.matchAll(/<item[^>]*>([\s\S]*?)<\/item>/gi)) items.push(m[1]);
  const records: Array<{ value: unknown; data_date: unknown; label: string | null; source_name: string; source_url: string }> = [];
  for (const item of items) {
    const title = extract(item, "title") ?? null;
    const link = extract(item, "link") ?? source.url;
    const pubDate = extract(item, "pubDate") ?? extract(item, "dc:date") ?? null;
    const content = extract(item, "description") ?? extract(item, "content:encoded") ?? "";
    const data_date = pubDate ? parseDate(pubDate) : null;
    const value = firstNumber(content) ?? firstNumber(title ?? "");
    records.push({ value, data_date, label: title, source_name: source.name, source_url: link });
  }
  return records;
}
