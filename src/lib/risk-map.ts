import { countries as mapAnchors } from "@/lib/mock-data";
import { formatRelative } from "@/lib/news-service";

export type RiskMapBand = "low" | "medium" | "high";

export interface MapCountryRisk {
  code: string; // ISO 2-letter code
  code3: string; // ISO 3-letter code
  name: string;
  region: string;
  x: number;
  y: number;
  riskScore: number;
  band: RiskMapBand;
  developments: { date: string; headline: string }[];
  articleCount: number;
  topRiskFactors: string[];
}

interface FeedArticle {
  title: string;
  summary?: string;
  pubDate?: number;
}

interface CountryLexiconEntry {
  code2: string; // 2-letter
  code3: string; // 3-letter
  name: string;
  region: string;
  pattern: RegExp;
}

export const COUNTRY_DATABASE: CountryLexiconEntry[] = [
  { code2: "US", code3: "USA", name: "United States", region: "North America", pattern: /\b(united states|u\.s\.|usa|american|washington|pentagon|white house)\b/gi },
  { code2: "UK", code3: "GBR", name: "United Kingdom", region: "Europe", pattern: /\b(united kingdom|britain|british|london|westminster|gbr)\b/gi },
  { code2: "RU", code3: "RUS", name: "Russia", region: "Eurasia", pattern: /\b(russia|russian|moscow|kremlin)\b/gi },
  { code2: "CN", code3: "CHN", name: "China", region: "Asia-Pacific", pattern: /\b(china|chinese|beijing|shanghai)\b/gi },
  { code2: "UA", code3: "UKR", name: "Ukraine", region: "Europe", pattern: /\b(ukraine|ukrainian|kyiv|kiev|donbas|crimea)\b/gi },
  { code2: "IL", code3: "ISR", name: "Israel", region: "Middle East", pattern: /\b(israel|israeli|tel aviv|jerusalem|gaza|hamas|hezbollah|netanyahu)\b/gi },
  { code2: "IR", code3: "IRN", name: "Iran", region: "Middle East", pattern: /\b(iran|iranian|tehran)\b/gi },
  { code2: "TW", code3: "TWN", name: "Taiwan", region: "Asia-Pacific", pattern: /\b(taiwan|taiwanese|taipei)\b/gi },
  { code2: "KP", code3: "PRK", name: "North Korea", region: "Asia-Pacific", pattern: /\b(north korea|pyongyang|dprk)\b/gi },
  { code2: "KR", code3: "KOR", name: "South Korea", region: "Asia-Pacific", pattern: /\b(south korea|seoul)\b/gi },
  { code2: "IN", code3: "IND", name: "India", region: "Asia-Pacific", pattern: /\b(india|indian|delhi|mumbai|new delhi)\b/gi },
  { code2: "PK", code3: "PAK", name: "Pakistan", region: "Asia-Pacific", pattern: /\b(pakistan|pakistani|islamabad)\b/gi },
  { code2: "SA", code3: "SAU", name: "Saudi Arabia", region: "Middle East", pattern: /\b(saudi arabia|saudi|riyadh)\b/gi },
  { code2: "SY", code3: "SYR", name: "Syria", region: "Middle East", pattern: /\b(syria|syrian|damascus|assad)\b/gi },
  { code2: "YE", code3: "YEM", name: "Yemen", region: "Middle East", pattern: /\b(yemen|yemeni|houthi|sanaa)\b/gi },
  { code2: "LB", code3: "LBN", name: "Lebanon", region: "Middle East", pattern: /\b(lebanon|lebanese|beirut)\b/gi },
  { code2: "TR", code3: "TUR", name: "Turkey", region: "Europe/Middle East", pattern: /\b(turkey|turkish|ankara|istanbul|erdogan)\b/gi },
  { code2: "DE", code3: "DEU", name: "Germany", region: "Europe", pattern: /\b(germany|german|berlin)\b/gi },
  { code2: "FR", code3: "FRA", name: "France", region: "Europe", pattern: /\b(france|french|paris|macron)\b/gi },
  { code2: "PL", code3: "POL", name: "Poland", region: "Europe", pattern: /\b(poland|polish|warsaw)\b/gi },
  { code2: "VE", code3: "VEN", name: "Venezuela", region: "South America", pattern: /\b(venezuela|venezuelan|caracas|maduro)\b/gi },
  { code2: "BR", code3: "BRA", name: "Brazil", region: "South America", pattern: /\b(brazil|brazilian|brasilia|brasil)\b/gi },
  { code2: "MX", code3: "MEX", name: "Mexico", region: "North America", pattern: /\b(mexico|mexican|mexico city)\b/gi },
  { code2: "EG", code3: "EGY", name: "Egypt", region: "Middle East", pattern: /\b(egypt|egyptian|cairo)\b/gi },
  { code2: "SD", code3: "SDN", name: "Sudan", region: "Africa", pattern: /\b(sudan|sudanese|khartoum)\b/gi },
  { code2: "ET", code3: "ETH", name: "Ethiopia", region: "Africa", pattern: /\b(ethiopia|ethiopian|addis ababa)\b/gi },
  { code2: "NG", code3: "NGA", name: "Nigeria", region: "Africa", pattern: /\b(nigeria|nigerian|abuja|lagos)\b/gi },
  { code2: "ZA", code3: "ZAF", name: "South Africa", region: "Africa", pattern: /\b(south africa|south african|pretoria|johannesburg)\b/gi },
  { code2: "AU", code3: "AUS", name: "Australia", region: "Asia-Pacific", pattern: /\b(australia|australian|canberra|sydney)\b/gi },
  { code2: "JP", code3: "JPN", name: "Japan", region: "Asia-Pacific", pattern: /\b(japan|japanese|tokyo)\b/gi },
  { code2: "AF", code3: "AFG", name: "Afghanistan", region: "Asia-Pacific", pattern: /\b(afghanistan|afghan|kabul|taliban)\b/gi },
  { code2: "IQ", code3: "IRQ", name: "Iraq", region: "Middle East", pattern: /\b(iraq|iraqi|baghdad)\b/gi },
  { code2: "PS", code3: "PSE", name: "Palestine", region: "Middle East", pattern: /\b(palestine|palestinian|west bank|gaza)\b/gi },
  { code2: "CA", code3: "CAN", name: "Canada", region: "North America", pattern: /\b(canada|canadian|ottawa|toronto)\b/gi },
  { code2: "ES", code3: "ESP", name: "Spain", region: "Europe", pattern: /\b(spain|spanish|madrid)\b/gi },
  { code2: "IT", code3: "ITA", name: "Italy", region: "Europe", pattern: /\b(italy|italian|rome)\b/gi },
];

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

export function computeGlobalRiskMap(articles: FeedArticle[]): MapCountryRisk[] {
  const aggregatedStats = new Map<
    string,
    {
      aggregatedScore: number;
      articleCount: number;
      developments: { date: string; headline: string }[];
      riskFactors: Set<string>;
    }
  >();

  // Initialize
  for (const c of COUNTRY_DATABASE) {
    aggregatedStats.set(c.code2, {
      aggregatedScore: 0,
      articleCount: 0,
      developments: [],
      riskFactors: new Set<string>(),
    });
  }

  // Aggregate scores and metadata from articles
  for (const article of articles) {
    const text = `${article.title} ${article.summary ?? ""}`;
    
    // Keyword weighting calculations
    const warMatches = (text.match(/war/gi) ?? []).length;
    const attackMatches = (text.match(/attack/gi) ?? []).length;
    const missileMatches = (text.match(/missile/gi) ?? []).length;
    const militaryMatches = (text.match(/military/gi) ?? []).length;
    const sanctionsMatches = (text.match(/sanction/gi) ?? []).length;
    const tensionsMatches = (text.match(/tension/gi) ?? []).length;

    const articleScore =
      warMatches * 5 +
      attackMatches * 4 +
      missileMatches * 4 +
      militaryMatches * 3 +
      sanctionsMatches * 2 +
      tensionsMatches * 1;

    if (articleScore === 0) continue;

    // Scan for country mentions
    for (const c of COUNTRY_DATABASE) {
      // Reset lastIndex for global regexp
      c.pattern.lastIndex = 0;
      if (c.pattern.test(text)) {
        const stats = aggregatedStats.get(c.code2)!;
        stats.aggregatedScore += articleScore;
        stats.articleCount += 1;

        if (warMatches > 0) stats.riskFactors.add("War");
        if (attackMatches > 0) stats.riskFactors.add("Attack");
        if (missileMatches > 0) stats.riskFactors.add("Missile");
        if (militaryMatches > 0) stats.riskFactors.add("Military");
        if (sanctionsMatches > 0) stats.riskFactors.add("Sanctions");
        if (tensionsMatches > 0) stats.riskFactors.add("Tensions");

        stats.developments.push({
          date: article.pubDate ? formatRelative(article.pubDate) : "Recent",
          headline: article.title,
        });
      }
    }
  }

  // Find maximum score across all countries for normalization
  let maxScore = 0;
  for (const stats of aggregatedStats.values()) {
    if (stats.aggregatedScore > maxScore) {
      maxScore = stats.aggregatedScore;
    }
  }

  // Construct MapCountryRisk array, normalization to 0-10
  return COUNTRY_DATABASE.map((c) => {
    const stats = aggregatedStats.get(c.code2)!;
    
    const riskScore = maxScore > 0 ? Math.round((stats.aggregatedScore / maxScore) * 10) : 0;
    const band = riskBandFromScore(riskScore);

    // Grab coordinates from mapAnchors if available
    const anchor = mapAnchors.find((a) => a.code === c.code2);
    const x = anchor?.x ?? 0;
    const y = anchor?.y ?? 0;

    return {
      code: c.code2,
      code3: c.code3,
      code2: c.code2,
      name: c.name,
      region: c.region,
      x,
      y,
      riskScore,
      band,
      developments: stats.developments.slice(0, 3),
      articleCount: stats.articleCount,
      topRiskFactors: Array.from(stats.riskFactors).slice(0, 3), // top 3 risk factors
    };
  });
}
