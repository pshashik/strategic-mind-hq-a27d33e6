export type TrendDirection = "up" | "down" | "stable";

export interface TrendingCountry {
  countryCode: string;
  countryName: string;
  mentionCount: number;
  riskScore: number;
  trendDirection: TrendDirection;
  percentageChange: number;
}

interface FeedArticle {
  title: string;
  summary?: string;
}

interface CountryLexiconEntry {
  code: string;
  name: string;
  pattern: RegExp;
}

const VOLATILITY_PATTERN =
  /\b(war|conflict|strike|attack|missile|sanctions?|escalat|invasion|bomb|troops|nuclear|crisis|hostage|ceasefire)\b/gi;

const COUNTRY_LEXICON: CountryLexiconEntry[] = [
  {
    code: "US",
    name: "United States",
    pattern: /\b(united states|u\.s\.|usa|american|washington|pentagon|white house)\b/gi,
  },
  {
    code: "UK",
    name: "United Kingdom",
    pattern: /\b(united kingdom|britain|british|london|westminster)\b/gi,
  },
  { code: "RU", name: "Russia", pattern: /\b(russia|russian|moscow|kremlin)\b/gi },
  { code: "CN", name: "China", pattern: /\b(china|chinese|beijing|shanghai)\b/gi },
  { code: "UA", name: "Ukraine", pattern: /\b(ukraine|ukrainian|kyiv|kiev|donbas|crimea)\b/gi },
  {
    code: "IL",
    name: "Israel",
    pattern: /\b(israel|israeli|tel aviv|jerusalem|gaza|hamas|hezbollah|netanyahu)\b/gi,
  },
  { code: "IR", name: "Iran", pattern: /\b(iran|iranian|tehran)\b/gi },
  { code: "TW", name: "Taiwan", pattern: /\b(taiwan|taiwanese|taipei)\b/gi },
  { code: "KP", name: "North Korea", pattern: /\b(north korea|pyongyang|dprk)\b/gi },
  { code: "KR", name: "South Korea", pattern: /\b(south korea|seoul)\b/gi },
  { code: "IN", name: "India", pattern: /\b(india|indian|delhi|mumbai|new delhi)\b/gi },
  { code: "PK", name: "Pakistan", pattern: /\b(pakistan|pakistani|islamabad)\b/gi },
  { code: "SA", name: "Saudi Arabia", pattern: /\b(saudi arabia|saudi|riyadh)\b/gi },
  { code: "SY", name: "Syria", pattern: /\b(syria|syrian|damascus|assad)\b/gi },
  { code: "YE", name: "Yemen", pattern: /\b(yemen|yemeni|houthi|sanaa)\b/gi },
  { code: "LB", name: "Lebanon", pattern: /\b(lebanon|lebanese|beirut)\b/gi },
  { code: "TR", name: "Turkey", pattern: /\b(turkey|turkish|ankara|istanbul|erdogan)\b/gi },
  { code: "DE", name: "Germany", pattern: /\b(germany|german|berlin)\b/gi },
  { code: "FR", name: "France", pattern: /\b(france|french|paris|macron)\b/gi },
  { code: "PL", name: "Poland", pattern: /\b(poland|polish|warsaw)\b/gi },
  { code: "VE", name: "Venezuela", pattern: /\b(venezuela|venezuelan|caracas|maduro)\b/gi },
  { code: "BR", name: "Brazil", pattern: /\b(brazil|brazilian|brasilia|brasil)\b/gi },
  { code: "MX", name: "Mexico", pattern: /\b(mexico|mexican|mexico city)\b/gi },
  { code: "EG", name: "Egypt", pattern: /\b(egypt|egyptian|cairo)\b/gi },
  { code: "SD", name: "Sudan", pattern: /\b(sudan|sudanese|khartoum)\b/gi },
  { code: "ET", name: "Ethiopia", pattern: /\b(ethiopia|ethiopian|addis ababa)\b/gi },
  { code: "NG", name: "Nigeria", pattern: /\b(nigeria|nigerian|abuja|lagos)\b/gi },
  {
    code: "ZA",
    name: "South Africa",
    pattern: /\b(south africa|south african|pretoria|johannesburg)\b/gi,
  },
  { code: "AU", name: "Australia", pattern: /\b(australia|australian|canberra|sydney)\b/gi },
  { code: "JP", name: "Japan", pattern: /\b(japan|japanese|tokyo)\b/gi },
  { code: "AF", name: "Afghanistan", pattern: /\b(afghanistan|afghan|kabul|taliban)\b/gi },
  { code: "IQ", name: "Iraq", pattern: /\b(iraq|iraqi|baghdad)\b/gi },
  { code: "PS", name: "Palestine", pattern: /\b(palestine|palestinian|west bank)\b/gi },
  { code: "EU", name: "European Union", pattern: /\b(european union|\beu\b|brussels)\b/gi },
  { code: "NATO", name: "NATO", pattern: /\b(nato|north atlantic treaty)\b/gi },
];

function countPatternMatches(text: string, pattern: RegExp): number {
  return (text.match(pattern) ?? []).length;
}

function countVolatility(text: string): number {
  return (text.match(VOLATILITY_PATTERN) ?? []).length;
}

function deriveTrend(
  recentHits: number,
  olderHits: number,
): { direction: TrendDirection; change: number } {
  if (recentHits > olderHits) {
    const change = Math.min(
      99,
      Math.round(((recentHits - olderHits) / Math.max(1, olderHits)) * 100),
    );
    return { direction: "up", change: change || recentHits * 5 };
  }
  if (recentHits < olderHits) {
    const change = Math.min(
      99,
      Math.round(((olderHits - recentHits) / Math.max(1, olderHits)) * 100),
    );
    return { direction: "down", change: change || olderHits * 3 };
  }
  return { direction: "stable", change: 0 };
}

/**
 * Extract country mentions from RSS titles/summaries, count occurrences, sort descending.
 */
export function computeTrendingCountries(articles: FeedArticle[]): TrendingCountry[] {
  if (articles.length === 0) return [];

  const midpoint = Math.ceil(articles.length / 2);
  const recentArticles = articles.slice(0, midpoint);
  const olderArticles = articles.slice(midpoint);

  const stats = new Map<
    string,
    {
      code: string;
      name: string;
      mentionCount: number;
      volatility: number;
      recentHits: number;
      olderHits: number;
    }
  >();

  const scanCorpus = (corpus: FeedArticle[], bucket: "recent" | "older") => {
    for (const article of corpus) {
      const text = `${article.title} ${article.summary ?? ""}`;
      for (const entry of COUNTRY_LEXICON) {
        const hits = countPatternMatches(text, entry.pattern);
        if (hits === 0) continue;

        const row = stats.get(entry.code) ?? {
          code: entry.code,
          name: entry.name,
          mentionCount: 0,
          volatility: 0,
          recentHits: 0,
          olderHits: 0,
        };

        row.mentionCount += hits;
        row.volatility += countVolatility(text);
        if (bucket === "recent") row.recentHits += hits;
        else row.olderHits += hits;

        stats.set(entry.code, row);
      }
    }
  };

  scanCorpus(recentArticles, "recent");
  scanCorpus(olderArticles, "older");

  return [...stats.values()]
    .sort((a, b) => b.mentionCount - a.mentionCount || b.volatility - a.volatility)
    .slice(0, 10)
    .map((row) => {
      const { direction, change } = deriveTrend(row.recentHits, row.olderHits);
      const riskScore = Math.min(100, Math.round(15 + row.mentionCount * 8 + row.volatility * 4));

      return {
        countryCode: row.code,
        countryName: row.name,
        mentionCount: row.mentionCount,
        riskScore,
        trendDirection: direction,
        percentageChange: change,
      };
    });
}
