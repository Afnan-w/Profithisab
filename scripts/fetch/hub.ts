import fs from "node:fs";
import path from "node:path";
import { politeFetch, BlockedError } from "./client";
import { validateBatch } from "./validate";
import { writeJson, readLastGood, resultPath, navHistoryPath, writeNavHistory } from "./store";
import { fetchRss } from "./rss.adapter";
import { fetchJsonApi } from "./json-api.adapter";
import { fetchHtml } from "./html.adapter";
import { fetchManual } from "./manual.adapter";

const DATA_DIR = path.join(process.cwd(), "data");
const SOURCES_FILE = path.join(DATA_DIR, "sources.json");

interface Source {
  id: string;
  name: string;
  type: string;
  url: string | null;
  data_type: string;
  category: string | null;
  schedule: string | null;
  enabled: boolean;
  delay_minutes: number | null;
}

interface SourcesFile {
  schemaVersion: number;
  sources: Source[];
}

function loadSources(): SourcesFile {
  const raw = JSON.parse(fs.readFileSync(SOURCES_FILE, "utf8"));
  return raw as SourcesFile;
}

const ADAPTERS: Record<string, (source: { url: string; name: string }) => Promise<Array<{ value: unknown; data_date: unknown; label: string | null; source_name: string; source_url: string }>>> = {
  rss: fetchRss,
  "json-api": fetchJsonApi,
  html: fetchHtml,
};

async function fetchSource(source: Source): Promise<Array<{ value: unknown; data_date: unknown; label: string | null; source_name: string; source_url: string }>> {
  if (source.type === "manual") return fetchManual({ name: source.name, url: source.url });
  const adapter = ADAPTERS[source.type];
  if (!adapter) throw new Error(`unsupported source type: ${source.type}`);
  if (!source.url) throw new Error(`source ${source.id} has no url`);
  return adapter({ url: source.url, name: source.name });
}

function buildPayload(source: Source, valid: any[], now: string) {
  return {
    schemaVersion: 1,
    source_name: source.name,
    source_url: source.url ?? null,
    data_type: source.data_type,
    category: source.category ?? null,
    data_date: valid[0]?.data_date ?? null,
    fetched_at: now,
    schedule: source.schedule ?? null,
    delay_minutes: source.delay_minutes ?? null,
    records: valid,
  };
}

async function main(types: string[]): Promise<void> {
  const file = loadSources();
  const now = new Date().toISOString();
  let ran = 0;
  for (const source of file.sources) {
    if (!source.enabled) continue;
    if (types.length && !types.includes(source.data_type)) continue;
    ran += 1;
    let records: Array<{ value: unknown; data_date: unknown; label: string | null; source_name: string; source_url: string }>;
    try {
      records = await fetchSource(source);
    } catch (e) {
      if (e instanceof BlockedError) {
        console.error(`[hub] ${source.id}: stopped — ${e.message}`);
      } else {
        console.error(`[hub] ${source.id}: fetch failed — ${e instanceof Error ? e.message : String(e)}`);
      }
      continue;
    }
    const { valid, invalid, ok } = validateBatch(records, source.data_type);
    if (!ok) {
      console.error(`[hub] ${source.id}: ${invalid}/${records.length} records failed validation (>20%), keeping last good data`);
      continue;
    }
    const payload = buildPayload(source, valid, now);
    writeJson(resultPath(source.data_type, source.id), payload);
    if (source.data_type === "nav") {
      const points = valid
        .map((r) => ({ date: r.data_date, nav: r.value }))
        .filter((p) => p.date && typeof p.nav === "number");
      writeNavHistory(source.id, source.name, source.url ?? "", points as Array<{ date: string; nav: number }>);
    }
    console.log(`[hub] ${source.id}: wrote ${valid.length} records (${invalid} invalid skipped)`);
  }
  if (ran === 0) console.log("[hub] no enabled sources matched the requested types");
}

const types = process.argv.slice(2).filter((t) => t !== "--no-cache");
main(types).catch((e) => {
  console.error(`[hub] fatal: ${e instanceof Error ? e.message : String(e)}`);
  process.exit(1);
});
