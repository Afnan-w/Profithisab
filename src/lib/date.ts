/** Date helpers that work identically on the server and in the browser (UTC). */

const MS_DAY = 86_400_000;

export function parseISO(iso: string): Date {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number);
  return new Date(Date.UTC(y, (m || 1) - 1, d || 1));
}

export function toISO(d: Date): string {
  return d.toISOString().slice(0, 10);
}

export function todayISO(): string {
  return toISO(new Date());
}

export function addDays(iso: string, days: number): string {
  return toISO(new Date(parseISO(iso).getTime() + days * MS_DAY));
}

export function daysBetween(a: string, b: string): number {
  return Math.round((parseISO(b).getTime() - parseISO(a).getTime()) / MS_DAY);
}

/** Add calendar months, clamping to the last valid day (31 Jan + 1 month = 28/29 Feb). */
export function addMonths(iso: string, months: number): string {
  const d = parseISO(iso);
  const targetMonth = d.getUTCMonth() + months;
  const year = d.getUTCFullYear() + Math.floor(targetMonth / 12);
  const month = ((targetMonth % 12) + 12) % 12;
  const lastDay = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const day = Math.min(d.getUTCDate(), lastDay);
  return toISO(new Date(Date.UTC(year, month, day)));
}

export function lastDayOfMonth(year: number, month1: number): string {
  return toISO(new Date(Date.UTC(year, month1, 0)));
}

/** "2026-10" → "2026-10-31" (the last calendar day of that month). */
export function endOfMonthKey(key: string): string {
  const [y, m] = key.split("-").map(Number);
  return lastDayOfMonth(y, m);
}

export function isValidISODate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = parseISO(value);
  return toISO(d) === value;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "2026-10" or "2026-10-31" → "Oct 2026". */
export function longDate(iso: string): string {
  const [y, m] = iso.split("-");
  if (!m) return y;
  return `${MONTHS[Number(m) - 1]} ${y}`;
}

/** "2026-10-31" → "31 Oct 2026". */
export function dayDate(iso: string): string {
  const [y, m, d] = iso.split("-");
  if (!d) return longDate(iso);
  return `${Number(d)} ${MONTHS[Number(m) - 1]} ${y}`;
}

/** "2026-10" → "Oct '26". */
export function monthLabel(iso: string): string {
  const [y, m] = iso.split("-");
  return `${MONTHS[Number(m) - 1]} '${y.slice(2)}`;
}
