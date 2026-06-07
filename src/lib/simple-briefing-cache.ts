import type { ExecutiveSummaryResult } from "@/lib/simple-briefing";

const CACHE_TTL_MS = 30 * 60 * 1000;
const STORAGE_KEY = "strategic-mind-executive-summary-cache";

export interface ExecutiveSummaryCacheEntry {
  cachedAt: number;
  feedKey: string;
  result: ExecutiveSummaryResult;
}

let memoryCache: ExecutiveSummaryCacheEntry | null = null;

function readStorage(): ExecutiveSummaryCacheEntry | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ExecutiveSummaryCacheEntry;
    if (!parsed?.cachedAt || !parsed.feedKey || !parsed.result?.summary) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeStorage(entry: ExecutiveSummaryCacheEntry): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entry));
  } catch {
    // ignore quota / private mode errors
  }
}

export function readExecutiveSummaryCache(feedKey?: string): ExecutiveSummaryCacheEntry | null {
  const cached = memoryCache ?? readStorage();
  if (!cached) return null;
  if (feedKey && cached.feedKey !== feedKey) return null;
  return cached;
}

export function isExecutiveSummaryCacheFresh(entry: ExecutiveSummaryCacheEntry | null): boolean {
  if (!entry) return false;
  return Date.now() - entry.cachedAt < CACHE_TTL_MS;
}

export function writeExecutiveSummaryCache(
  feedKey: string,
  result: ExecutiveSummaryResult,
): ExecutiveSummaryCacheEntry {
  const entry: ExecutiveSummaryCacheEntry = { cachedAt: Date.now(), feedKey, result };
  memoryCache = entry;
  writeStorage(entry);
  return entry;
}

export { CACHE_TTL_MS as EXECUTIVE_SUMMARY_CACHE_TTL_MS };
