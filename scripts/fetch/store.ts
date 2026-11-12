import fs from "node:fs";
import path from "node:path";

const DATA_DIR = path.join(process.cwd(), "data");

export function ensureDir(dir: string): void {
  fs.mkdirSync(dir, { recursive: true });
}

export function writeJson(file: string, payload: unknown): void {
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, `${JSON.stringify(payload, null, 2)}\n`);
}

export function readLastGood(file: string): unknown {
  try {
    return JSON.parse(fs.readFileSync(file, "utf8"));
  } catch {
    return null;
  }
}

export function resultPath(data_type: string, id: string): string {
  return path.join(DATA_DIR, `${data_type}-${id}.json`);
}

export function navHistoryPath(slug: string): string {
  return path.join(DATA_DIR, "nav-history", `${slug}.json`);
}

export function manualPath(slug: string): string {
  return path.join(DATA_DIR, "manual", `${slug}.json`);
}

export function writeNavHistory(slug: string, source_name: string, source_url: string, points: Array<{ date: string; nav: number }>): void {
  const file = navHistoryPath(slug);
  const existing = readLastGood(file) as { points?: Array<{ date: string; nav: number }> } | null;
  const merged = new Map<string, number>();
  for (const p of (existing?.points ?? [])) merged.set(p.date, p.nav);
  for (const p of points) merged.set(p.date, p.nav);
  const all = [...merged.entries()].map(([date, nav]) => ({ date, nav })).sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0));
  writeJson(file, { slug, source_name, source_url, fetched_at: new Date().toISOString(), points: all });
}

export function listManual(): string[] {
  const dir = path.join(DATA_DIR, "manual");
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir).filter((f) => f.endsWith(".json"));
}
