import { politeFetch } from "./client";
import { parseDate } from "./validate";

function norm(rec: unknown, source: { name: string; url: string }): { value: unknown; data_date: unknown; label: string | null; source_name: string; source_url: string } | null {
  const o = rec && typeof rec === "object" ? (rec as Record<string, unknown>) : null;
  if (!o) return null;
  const value = o.value ?? o.nav ?? o.rate ?? o.price ?? o.level ?? null;
  const data_date = o.data_date ?? o.date ?? o.published_at ?? null;
  const label = (typeof o.label === "string" ? o.label : typeof o.name === "string" ? o.name : typeof o.title === "string" ? o.title : null);
  const source_name = typeof o.source_name === "string" ? o.source_name : source.name;
  const source_url = typeof o.source_url === "string" ? o.source_url : source.url;
  return { value, data_date, label, source_name, source_url };
}

export async function fetchJsonApi(source: { url: string; name: string }): Promise<Array<{ value: unknown; data_date: unknown; label: string | null; source_name: string; source_url: string }>> {
  const text = await politeFetch(source.url);
  let json: unknown;
  try { json = JSON.parse(text); } catch { return []; }
  const arr: unknown[] = Array.isArray(json)
    ? json
    : json && typeof json === "object" && Array.isArray((json as Record<string, unknown>).records)
      ? ((json as Record<string, unknown>).records as unknown[])
      : [];
  const records: Array<{ value: unknown; data_date: unknown; label: string | null; source_name: string; source_url: string }> = [];
  for (const rec of arr) {
    const n = norm(rec, source);
    if (n) records.push(n);
  }
  return records;
}
