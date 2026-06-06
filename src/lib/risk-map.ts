import { countries as mapAnchors } from "@/lib/mock-data";
import { formatRelative } from "@/lib/news-service";

export type RiskMapBand = "low" | "medium" | "high";

export interface MapCountryRisk {
  code: string;
  name: string;
  region: string;
  x: number;
  y: number;
  riskScore: number;
  band: RiskMapBand;
  developments: { date: string; headline: string }[];
}

interface FeedArticle {
  title: string;
  summary?: string;
  pubDate?: number;
}

interface CountryPattern {
  code: string;
  pattern: RegExp;
}

const HIGH_RISK_KEYWORDS = /\b(war|attack|conflict|military|sanctions?|missile)\b/gi;
const MEDIUM_RISK_KEYWORDS = /\b(tension|dispute|instability|protest)\b/gi;

/** Country name patterns aligned with map anchor codes in mock-data. */
const MAP_COUNTRY_PATTERNS: CountryPattern[] = [
  { code: "US", pattern: /\b(united states|u\.s\.|usa|american|washington|pentagon)\b/gi },
  { code: "UK", pattern: /\b(united kingdom|britain|british|london)\b/gi },
  { code: "RU", pattern: /\b(russia|russian|moscow|kremlin)\b/gi },
  { code: "CN", pattern: /\b(china|chinese|beijing)\b/gi },
  { code: "UA", pattern: /\b(ukraine|ukrainian|kyiv|kiev|donbas|crimea)\b/gi },
  { code: "IL", pattern: /\b(israel|israeli|gaza|hamas|hezbollah|jerusalem)\b/gi },
  { code: "IR", pattern: /\b(iran|iranian|tehran)\b/gi },
  { code: "TW", pattern: /\b(taiwan|taiwanese|taipei)\b/gi },
  { code: "KP", pattern: /\b(north korea|pyongyang|dprk)\b/gi },
  { code: "IN", pattern: /\b(india|indian|delhi|mumbai)\b/gi },
  { code: "DE", pattern: /\b(germany|german|berlin)\b/gi },
  { code: "BR", pattern: /\b(brazil|brazilian|brasilia)\b/gi },
  { code: "ZA", pattern: /\b(south africa|south african|pretoria|johannesburg)\b/gi },
  { code: "VE", pattern: /\b(venezuela|venezuelan|caracas|maduro)\b/gi },
];

function countMatches(text: string, pattern: RegExp): number {
  return (text.match(pattern) ?? []).length;
}

function scoreFromKeywords(high: number, medium: number): number {
  return Math.min(10, high * 2 + medium);
}

export function riskBandFromScore(score: number): RiskMapBand {
  if (score >= 7) return "high";
  if (score >= 4) return "medium";
  return "low";
}

export function riskBandLabel(band: RiskMapBand): string {
  return { low: "Green", medium: "Yellow", high: "Red" }[band];
}

export function riskBandDotClass(band: RiskMapBand): string {
  return {
    low: "fill-emerald-500",
    medium: "fill-yellow-500",
    high: "fill-red-500",
  }[band];
}

export function riskBandBadgeClass(band: RiskMapBand): string {
  return {
    low: "text-emerald-400 bg-emerald-500/10 border-emerald-500/30",
    medium: "text-yellow-400 bg-yellow-500/10 border-yellow-500/30",
    high: "text-red-400 bg-red-500/10 border-red-500/30",
  }[band];
}

export function riskBandBarClass(band: RiskMapBand): string {
  return {
    low: "bg-emerald-500",
    medium: "bg-yellow-500",
    high: "bg-red-500",
  }[band];
}

/**
 * Score countries 0–10 from RSS keyword analysis.
 * High-risk keywords (+2 each): war, attack, conflict, military, sanctions, missile
 * Medium-risk keywords (+1 each): tension, dispute, instability, protest
 */
export function computeGlobalRiskMap(articles: FeedArticle[]): MapCountryRisk[] {
  const patternByCode = new Map(MAP_COUNTRY_PATTERNS.map((p) => [p.code, p.pattern]));

  const stats = new Map<
    string,
    { high: number; medium: number; headlines: { date: string; headline: string }[] }
  >();

  for (const anchor of mapAnchors) {
    stats.set(anchor.code, { high: 0, medium: 0, headlines: [] });
  }

  for (const article of articles) {
    const text = `${article.title} ${article.summary ?? ""}`;
    const high = countMatches(text, HIGH_RISK_KEYWORDS);
    const medium = countMatches(text, MEDIUM_RISK_KEYWORDS);
    if (high === 0 && medium === 0) continue;

    for (const anchor of mapAnchors) {
      const pattern = patternByCode.get(anchor.code);
      if (!pattern || countMatches(text, pattern) === 0) continue;

      const row = stats.get(anchor.code)!;
      row.high += high;
      row.medium += medium;
      row.headlines.push({
        date: article.pubDate ? formatRelative(article.pubDate) : "Recent",
        headline: article.title,
      });
    }
  }

  return mapAnchors.map((anchor) => {
    const row = stats.get(anchor.code)!;
    const riskScore = scoreFromKeywords(row.high, row.medium);
    const band = riskBandFromScore(riskScore);

    return {
      code: anchor.code,
      name: anchor.name,
      region: anchor.region,
      x: anchor.x,
      y: anchor.y,
      riskScore,
      band,
      developments: row.headlines.slice(0, 3),
    };
  });
}
