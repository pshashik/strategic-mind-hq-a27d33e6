import type { StrategicAlert } from "@/lib/alerts.functions";

const CACHE_TTL_MS = 30 * 60 * 1000;
const STORAGE_KEY = "strategic-mind-alerts-cache";

export interface AlertsCacheEntry {
  cachedAt: number;
  feedKey: string;
  alerts: StrategicAlert[];
}

let memoryCache: AlertsCacheEntry | null = null;
let fetchInFlight = false;

function readStorage(): AlertsCacheEntry | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AlertsCacheEntry;
    if (!parsed?.cachedAt || !Array.isArray(parsed.alerts)) return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeStorage(entry: AlertsCacheEntry): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entry));
  } catch {
    // ignore quota / private mode errors
  }
}

export function readAlertsCache(): AlertsCacheEntry | null {
  return memoryCache ?? readStorage();
}

export function isAlertsCacheFresh(entry: AlertsCacheEntry | null): boolean {
  if (!entry) return false;
  return Date.now() - entry.cachedAt < CACHE_TTL_MS;
}

export function writeAlertsCache(feedKey: string, alerts: StrategicAlert[]): AlertsCacheEntry {
  const entry: AlertsCacheEntry = { cachedAt: Date.now(), feedKey, alerts };
  memoryCache = entry;
  writeStorage(entry);
  return entry;
}

export function isAlertsFetchInFlight(): boolean {
  return fetchInFlight;
}

export function setAlertsFetchInFlight(inFlight: boolean): void {
  fetchInFlight = inFlight;
}

export { CACHE_TTL_MS as ALERTS_CACHE_TTL_MS };
