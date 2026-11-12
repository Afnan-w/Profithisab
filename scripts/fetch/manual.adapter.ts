import fs from "node:fs";
import path from "node:path";
import { listManual, manualPath } from "./store";

export async function fetchManual(source: { name: string; url: string | null }): Promise<Array<{ value: unknown; data_date: unknown; label: string | null; source_name: string; source_url: string }>> {
  const records: Array<{ value: unknown; data_date: unknown; label: string | null; source_name: string; source_url: string }> = [];
  for (const file of listManual()) {
    let data: unknown;
    try { data = JSON.parse(fs.readFileSync(manualPath(file), "utf8")); } catch { continue; }
    const o = data && typeof data === "object" ? (data as Record<string, unknown>) : null;
    if (!o) continue;
    // Templates ship in the repo with "draft": true and are never ingested.
    if (o.draft === true) continue;
    const slug = file.replace(/\.json$/, "");
    records.push({
      value: o.value ?? null,
      data_date: o.data_date ?? o.updated ?? null,
      label: typeof o.label === "string" ? o.label : slug,
      source_name: typeof o.source_name === "string" ? o.source_name : source.name,
      source_url: typeof o.source_url === "string" ? o.source_url : (source.url ?? ""),
    });
  }
  return records;
}
