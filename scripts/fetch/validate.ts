export interface ValidatedRecord {
  value: number;
  data_date: string;
  source_name: string;
  source_url: string;
  fetched_at: string;
  label?: string | null;
  category?: string | null;
  delay_minutes?: number | null;
  [key: string]: unknown;
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function isValidDate(v: unknown): v is string {
  if (typeof v !== "string" || !ISO_DATE.test(v)) return false;
  // Reject impossible calendar dates such as 2026-02-30 (regex alone allows them).
  return parseDate(v) === v;
}

const MONTHS: Record<string, number> = { jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6, jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12 };

export function parseDate(raw: string): string | null {
  const s = raw.trim();
  if (ISO_DATE.test(s)) {
    const [y, m, d] = s.split("-").map(Number);
    const dt = new Date(Date.UTC(y, m - 1, d));
    if (dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d) return s;
    return null;
  }
  const m1 = s.match(/^(\d{1,2})[-\s]([A-Za-z]{3})[-\s](\d{2,4})$/);
  if (m1) {
    const mi = MONTHS[m1[2].toLowerCase()];
    if (!mi) return null;
    let year = Number(m1[3]);
    if (year < 100) year += 2000;
    const day = Number(m1[1]);
    return `${String(year)}-${String(mi).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  }
  const m2 = s.match(/^([A-Za-z]{3,})\s+(\d{1,2}),?\s+(\d{4})$/);
  if (m2) {
    const mi = MONTHS[m2[1].slice(0, 3).toLowerCase()];
    if (!mi) return null;
    return `${m2[3]}-${String(mi).padStart(2, "0")}-${String(Number(m2[2])).padStart(2, "0")}`;
  }
  return null;
}

export function validateRecord(rec: { value: unknown; data_date: unknown; source_name: unknown; source_url: unknown; label?: unknown; category?: unknown; delay_minutes?: unknown }, data_type: string): { ok: boolean; reason?: string; record?: ValidatedRecord } {
  if (!rec.source_url || typeof rec.source_url !== "string") return { ok: false, reason: "missing source_url" };
  if (!isValidDate(rec.data_date)) return { ok: false, reason: "missing or invalid data_date" };
  const value = Number(rec.value);
  if (!Number.isFinite(value)) return { ok: false, reason: "value is not a finite number" };
  if (data_type === "nav") {
    if (value <= 0) return { ok: false, reason: "NAV must be a positive number" };
  }
  if (data_type === "rates" || data_type === "fdr") {
    if (value < 0 || value > 30) return { ok: false, reason: "rate outside sane range 0-30" };
  }
  if (data_type === "index") {
    if (value <= 0) return { ok: false, reason: "index level must be positive" };
  }
  return {
    ok: true,
    record: {
      value,
      data_date: rec.data_date,
      source_name: typeof rec.source_name === "string" ? rec.source_name : "",
      source_url: rec.source_url,
      fetched_at: new Date().toISOString(),
      label: typeof rec.label === "string" ? rec.label : null,
      category: typeof rec.category === "string" ? rec.category : null,
      delay_minutes: typeof rec.delay_minutes === "number" ? rec.delay_minutes : null,
    },
  };
}

export function validateBatch(recs: Array<{ value: unknown; data_date: unknown; source_name: unknown; source_url: unknown }>, data_type: string): { valid: ValidatedRecord[]; invalid: number; ok: boolean } {
  const valid: ValidatedRecord[] = [];
  let invalid = 0;
  for (const rec of recs) {
    const v = validateRecord(rec, data_type);
    if (v.ok && v.record) valid.push(v.record);
    else invalid += 1;
  }
  const total = recs.length;
  const passRate = total === 0 ? 0 : valid.length / total;
  return { valid, invalid, ok: passRate >= 0.8 };
}
