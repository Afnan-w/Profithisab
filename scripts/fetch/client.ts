import fs from "node:fs";

export const USER_AGENT = "ProfithisabDataBot/2.0 (https://profithisab.vercel.app; contact data@profithisab.com)";
export const REQUEST_DELAY_MS = 3000;
export const TIMEOUT_MS = 15000;
export const MAX_RETRIES = 2;

const lastRequestByHost = new Map<string, number>();
const robotsCache = new Map<string, { allow: string[]; deny: string[]; fetchedAt: number }>();

export class BlockedError extends Error {
  constructor(url: string, reason: string) {
    super(`Blocked: ${url} — ${reason}`);
    this.name = "BlockedError";
  }
}

function hostOf(url: string): string {
  return new URL(url).hostname;
}

function pathOf(url: string): string {
  return new URL(url).pathname;
}

const sleep = (ms: number): Promise<void> => new Promise((r) => setTimeout(r, ms));

function parseRobots(text: string): { allow: string[]; deny: string[] } {
  const allow: string[] = [];
  const deny: string[] = [];
  let currentApplies = false;
  const uaToken = "profithisabdatabot";
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const sep = line.indexOf(":");
    if (sep === -1) continue;
    const key = line.slice(0, sep).trim().toLowerCase();
    const val = line.slice(sep + 1).trim();
    if (key === "user-agent") {
      currentApplies = val === "*" || val.toLowerCase().includes(uaToken);
      continue;
    }
    if (!currentApplies) continue;
    if (key === "disallow" && val) deny.push(val);
    if (key === "allow" && val) allow.push(val);
  }
  return { allow, deny };
}

function pathMatches(path: string, rule: string): boolean {
  if (!rule) return false;
  if (rule === "/") return true;
  if (rule.endsWith("*")) return path.startsWith(rule.slice(0, -1));
  return path === rule || path.startsWith(rule + "/");
}

function isAllowed(requestPath: string, rules: { allow: string[]; deny: string[] }): boolean {
  let bestAllow = -1;
  let bestDeny = -1;
  for (const r of rules.allow) if (pathMatches(requestPath, r)) bestAllow = Math.max(bestAllow, r.length);
  for (const r of rules.deny) if (pathMatches(requestPath, r)) bestDeny = Math.max(bestDeny, r.length);
  if (bestDeny > bestAllow) return false;
  return true;
}

async function getRobotsRules(host: string): Promise<{ allow: string[]; deny: string[] } | null> {
  const cached = robotsCache.get(host);
  const now = Date.now();
  if (cached && now - cached.fetchedAt < 86400000) return { allow: cached.allow, deny: cached.deny };
  try {
    const robotsUrl = `https://${host}/robots.txt`;
    const res = await fetch(robotsUrl, {
      headers: { "user-agent": USER_AGENT },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
    if (!res.ok) return null;
    const text = await res.text();
    const rules = parseRobots(text);
    robotsCache.set(host, { ...rules, fetchedAt: now });
    return rules;
  } catch {
    return null;
  }
}

function looksLikeBlock(status: number, text: string): boolean {
  if (status === 401 || status === 403 || status === 429 || status === 405 || status === 503) return true;
  const low = text.toLowerCase();
  return /captcha|log\s*in|sign\s*in|access\s*denied|blocked|unusual traffic|automated|robot/.test(low);
}

export async function politeFetch(url: string, opts: { method?: string; body?: string } = {}): Promise<string> {
  const host = hostOf(url);
  const reqPath = pathOf(url);
  const rules = await getRobotsRules(host);
  if (rules && !isAllowed(reqPath, rules)) throw new BlockedError(url, "disallowed by robots.txt");

  const last = lastRequestByHost.get(host) ?? 0;
  const since = Date.now() - last;
  if (since < REQUEST_DELAY_MS) await sleep(REQUEST_DELAY_MS - since);

  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    lastRequestByHost.set(host, Date.now());
    try {
      const res = await fetch(url, {
        method: opts.method ?? "GET",
        headers: { "user-agent": USER_AGENT, accept: "*/*" },
        body: opts.body,
        signal: AbortSignal.timeout(TIMEOUT_MS),
      });
      const text = await res.text();
      if (looksLikeBlock(res.status, text)) throw new BlockedError(url, `HTTP ${res.status}`);
      if (!res.ok) {
        lastError = new Error(`HTTP ${res.status} for ${url}`);
        if (attempt < MAX_RETRIES) { await sleep((attempt + 1) * 1000); continue; }
        throw lastError;
      }
      return text;
    } catch (e) {
      if (e instanceof BlockedError) throw e;
      lastError = e instanceof Error ? e : new Error(String(e));
      if (attempt < MAX_RETRIES) { await sleep((attempt + 1) * 1000); continue; }
      throw lastError;
    }
  }
  throw lastError ?? new Error(`Failed to fetch ${url}`);
}
