import { getLatestNews } from "./news.functions";

export type { NewsItem } from "./news.functions";

export interface LocalGeopoliticalRisk {
  riskName: string;
  severityScore: number;
  regionAffected: string;
}

/** Keyword-weight map for offline Top Risks when Gemini rate-limits (429). */
const RISK_SIGNALS: { pattern: RegExp; weight: number; region: string; label: string }[] = [
  { pattern: /gulf strikes?|strait of hormuz|houthi|red sea/i, weight: 15, region: "Middle East", label: "Gulf Strikes & Maritime Threat" },
  { pattern: /ukraine|russia|donbas|crimea|kyiv/i, weight: 14, region: "Eastern Europe", label: "Ukraine-Russia Escalation" },
  { pattern: /taiwan|south china sea|beijing|pla\b/i, weight: 13, region: "Indo-Pacific", label: "Indo-Pacific Military Tension" },
  { pattern: /nuclear|warhead|icbm|enrichment/i, weight: 12, region: "Global", label: "Nuclear Proliferation Risk" },
  { pattern: /sanctions?|tariff|trade war|supply chain/i, weight: 11, region: "Global", label: "Economic Disruption & Sanctions" },
  { pattern: /missile|drone strike|airstrike|bombard/i, weight: 10, region: "Global", label: "Kinetic Military Escalation" },
  { pattern: /ceasefire|diplomatic|summit|negotiat/i, weight: 6, region: "Global", label: "Diplomatic Instability" },
  { pattern: /protest|unrest|coup|insurgent/i, weight: 9, region: "Global", label: "Internal Security Unrest" },
  { pattern: /oil|opec|energy crisis|gas pipeline/i, weight: 8, region: "Global", label: "Energy Market Shock" },
  { pattern: /cyber|hack|infrastructure attack/i, weight: 7, region: "Global", label: "Cyber Infrastructure Threat" },
];

export async function fetchAllNews() {
  const res = await getLatestNews();
  return res.items;
}

export function formatRelative(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min${mins === 1 ? "" : "s"} ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24)
    return new Date(ts).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  const days = Math.round(hrs / 24);
  return `${days}d ago`;
}

/** Compact relative time for alert badges, e.g. "12m ago", "2h ago". */
export function formatRelativeShort(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return `${days}d ago`;
}

/** Normalize Gemini or ISO timestamps into compact relative display. */
export function formatAlertTimestamp(value: string, fallbackTs?: number): string {
  const s = value.trim();
  if (/^\d+[mhd]\s*ago$/i.test(s) || s.toLowerCase() === "just now") return s;
  // Gemini often hallucinates ISO dates — prefer live article pubDate instead
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    if (fallbackTs) return formatRelativeShort(fallbackTs);
    return "Just now";
  }
  const parsed = Date.parse(s);
  if (!Number.isNaN(parsed)) return formatRelativeShort(parsed);
  if (fallbackTs) return formatRelativeShort(fallbackTs);
  return "Just now";
}

/**
 * Lightweight local Top Risks fallback — scores keyword frequencies in the live RSS feed.
 * Used when Gemini returns HTTP 429 (rate limit).
 */
export function computeLocalTopRisks(articles: Pick<NewsItem, "title" | "summary">[]): LocalGeopoliticalRisk[] {
  const buckets = new Map<string, { score: number; region: string; label: string; hits: number }>();

  for (const article of articles) {
    const text = `${article.title} ${article.summary ?? ""}`;
    for (const signal of RISK_SIGNALS) {
      if (!signal.pattern.test(text)) continue;
      const existing = buckets.get(signal.label) ?? {
        score: 20,
        region: signal.region,
        label: signal.label,
        hits: 0,
      };
      existing.score = Math.min(100, existing.score + signal.weight);
      existing.hits += 1;
      buckets.set(signal.label, existing);
    }
  }

  if (buckets.size === 0) {
    return articles.slice(0, 5).map((a, i) => ({
      riskName: a.title.length > 60 ? `${a.title.slice(0, 57)}…` : a.title,
      severityScore: Math.max(25, 55 - i * 8),
      regionAffected: "Global",
    }));
  }

  return [...buckets.values()]
    .sort((a, b) => b.score - a.score || b.hits - a.hits)
    .slice(0, 5)
    .map((b) => ({
      riskName: b.label,
      severityScore: b.score,
      regionAffected: b.region,
    }));
}

export function isRateLimitError(error: string | null | undefined): boolean {
  if (!error) return false;
  return /429|rate limit|quota|resource exhausted/i.test(error);
}
