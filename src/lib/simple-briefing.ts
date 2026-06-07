export interface ExecutiveSummaryArticle {
  title: string;
  description: string;
  country?: string;
  region?: string;
  topic?: string;
  riskScore?: number;
}

export interface ExecutiveSummaryMetrics {
  mostMentionedCountry: string;
  highestRiskRegion: string;
  secondaryRegion: string;
  mostCommonTopic: string;
  topArticleCount: number;
}

export interface ExecutiveSummaryResult {
  summary: string;
  metrics: ExecutiveSummaryMetrics;
}

interface NormalizedArticle {
  title: string;
  description: string;
  country: string;
  region: string;
  topic: string;
  riskScore: number;
  index: number;
  text: string;
}

interface LexiconEntry {
  name: string;
  pattern: RegExp;
}

interface WeightedCount {
  label: string;
  count: number;
  riskTotal: number;
  firstIndex: number;
}

const DEFAULT_COUNTRY = "Multiple countries";
const DEFAULT_REGION = "Global";
const DEFAULT_TOPIC = "strategic";

const COUNTRY_LEXICON: LexiconEntry[] = [
  {
    name: "United States",
    pattern: /\b(united states|u\.s\.|usa|american|washington|pentagon|white house)\b/gi,
  },
  { name: "United Kingdom", pattern: /\b(united kingdom|britain|british|london|westminster)\b/gi },
  { name: "Russia", pattern: /\b(russia|russian|moscow|kremlin)\b/gi },
  { name: "China", pattern: /\b(china|chinese|beijing|shanghai)\b/gi },
  { name: "Ukraine", pattern: /\b(ukraine|ukrainian|kyiv|kiev|donbas|crimea)\b/gi },
  {
    name: "Israel",
    pattern: /\b(israel|israeli|tel aviv|jerusalem|gaza|hamas|hezbollah|netanyahu)\b/gi,
  },
  { name: "Iran", pattern: /\b(iran|iranian|tehran)\b/gi },
  { name: "Taiwan", pattern: /\b(taiwan|taiwanese|taipei)\b/gi },
  { name: "North Korea", pattern: /\b(north korea|pyongyang|dprk)\b/gi },
  { name: "South Korea", pattern: /\b(south korea|seoul)\b/gi },
  { name: "India", pattern: /\b(india|indian|delhi|mumbai|new delhi)\b/gi },
  { name: "Pakistan", pattern: /\b(pakistan|pakistani|islamabad)\b/gi },
  { name: "Saudi Arabia", pattern: /\b(saudi arabia|saudi|riyadh)\b/gi },
  { name: "Syria", pattern: /\b(syria|syrian|damascus|assad)\b/gi },
  { name: "Yemen", pattern: /\b(yemen|yemeni|houthi|sanaa)\b/gi },
  { name: "Lebanon", pattern: /\b(lebanon|lebanese|beirut)\b/gi },
  { name: "Turkey", pattern: /\b(turkey|turkish|ankara|istanbul|erdogan)\b/gi },
  { name: "Germany", pattern: /\b(germany|german|berlin)\b/gi },
  { name: "France", pattern: /\b(france|french|paris|macron)\b/gi },
  { name: "Poland", pattern: /\b(poland|polish|warsaw)\b/gi },
  { name: "Venezuela", pattern: /\b(venezuela|venezuelan|caracas|maduro)\b/gi },
  { name: "Brazil", pattern: /\b(brazil|brazilian|brasilia|brasil)\b/gi },
  { name: "Mexico", pattern: /\b(mexico|mexican|mexico city)\b/gi },
  { name: "Egypt", pattern: /\b(egypt|egyptian|cairo)\b/gi },
  { name: "Sudan", pattern: /\b(sudan|sudanese|khartoum)\b/gi },
  { name: "Ethiopia", pattern: /\b(ethiopia|ethiopian|addis ababa)\b/gi },
  { name: "Nigeria", pattern: /\b(nigeria|nigerian|abuja|lagos)\b/gi },
  { name: "South Africa", pattern: /\b(south africa|south african|pretoria|johannesburg)\b/gi },
  { name: "Australia", pattern: /\b(australia|australian|canberra|sydney)\b/gi },
  { name: "Japan", pattern: /\b(japan|japanese|tokyo)\b/gi },
  { name: "Afghanistan", pattern: /\b(afghanistan|afghan|kabul|taliban)\b/gi },
  { name: "Iraq", pattern: /\b(iraq|iraqi|baghdad)\b/gi },
  { name: "Palestine", pattern: /\b(palestine|palestinian|west bank)\b/gi },
  { name: "European Union", pattern: /\b(european union|\beu\b|brussels)\b/gi },
  { name: "NATO", pattern: /\b(nato|north atlantic treaty)\b/gi },
];

const REGION_PATTERNS: LexiconEntry[] = [
  {
    name: "Middle East",
    pattern:
      /\b(gaza|israel|iran|tehran|hamas|hezbollah|houthi|red sea|strait of hormuz|syria|yemen|lebanon|iraq)\b/gi,
  },
  {
    name: "Eastern Europe",
    pattern: /\b(ukraine|russia|kyiv|kiev|moscow|donbas|crimea|nato|poland)\b/gi,
  },
  {
    name: "Indo-Pacific",
    pattern:
      /\b(china|taiwan|beijing|south china sea|philippines|japan|korea|pyongyang|seoul|australia)\b/gi,
  },
  {
    name: "South Asia",
    pattern: /\b(india|pakistan|kashmir|afghanistan|taliban|delhi|islamabad)\b/gi,
  },
  { name: "Africa", pattern: /\b(sudan|ethiopia|nigeria|sahel|niger|mali|congo|south africa)\b/gi },
  {
    name: "Latin America",
    pattern: /\b(venezuela|mexico|brazil|colombia|caracas|mexico city|brasilia)\b/gi,
  },
  {
    name: "Europe",
    pattern: /\b(european union|europe|germany|france|britain|london|berlin|paris|brussels)\b/gi,
  },
  { name: "North America", pattern: /\b(united states|u\.s\.|usa|washington|canada|mexico)\b/gi },
];

const TOPIC_PATTERNS: LexiconEntry[] = [
  {
    name: "military",
    pattern:
      /\b(war|conflict|strike|attack|missile|drone|troops|airstrike|bombard|invasion|military)\b/gi,
  },
  {
    name: "diplomatic",
    pattern: /\b(ceasefire|summit|negotiat|talks|diplomatic|agreement|treaty)\b/gi,
  },
  { name: "sanctions", pattern: /\b(sanctions?|embargo|tariff|asset freeze|blacklist)\b/gi },
  { name: "energy", pattern: /\b(oil|gas|lng|pipeline|opec|energy|nuclear power)\b/gi },
  { name: "nuclear", pattern: /\b(nuclear|warhead|icbm|enrichment|uranium)\b/gi },
  { name: "cyber", pattern: /\b(cyber|hack|malware|ransomware|infrastructure attack)\b/gi },
  { name: "trade", pattern: /\b(trade|supply chain|shipping|exports?|imports?|market)\b/gi },
  { name: "unrest", pattern: /\b(protest|unrest|coup|riot|insurgent|rebellion)\b/gi },
  { name: "humanitarian", pattern: /\b(humanitarian|refugee|hostage|aid|famine|evacuat)\b/gi },
];

const RISK_SIGNAL_PATTERNS: Array<{ pattern: RegExp; score: number }> = [
  {
    pattern: /\b(war|invasion|airstrike|missile|drone|attack|bombard|clash|shelling)\b/gi,
    score: 30,
  },
  { pattern: /\b(nuclear|enrichment|warhead|icbm|uranium)\b/gi, score: 28 },
  { pattern: /\b(sanctions?|tariff|embargo|trade war|blockade)\b/gi, score: 22 },
  { pattern: /\b(ceasefire|negotiat|summit|diplomatic)\b/gi, score: 16 },
  { pattern: /\b(protest|unrest|coup|riot|insurgent)\b/gi, score: 20 },
  { pattern: /\b(cyber|hack|malware|ransomware)\b/gi, score: 18 },
  { pattern: /\b(energy|oil|gas|lng|pipeline)\b/gi, score: 14 },
];

function normalizeText(value: string | null | undefined): string {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function titleCase(value: string): string {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

function clampRiskScore(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

function countPatternMatches(text: string, pattern: RegExp): number {
  return (text.match(pattern) ?? []).length;
}

function uniqueMatches(text: string, lexicon: LexiconEntry[]): string[] {
  const matches = new Set<string>();
  for (const entry of lexicon) {
    if (entry.pattern.test(text)) matches.add(entry.name);
    entry.pattern.lastIndex = 0;
  }
  return [...matches];
}

function scoreRiskFromText(text: string): number {
  let score = 25;
  for (const signal of RISK_SIGNAL_PATTERNS) {
    const hits = countPatternMatches(text, signal.pattern);
    score += hits * signal.score;
  }
  if (!text) return 0;
  return clampRiskScore(score);
}

function inferLexiconValue(
  explicitValue: string,
  text: string,
  lexicon: LexiconEntry[],
  fallback: string,
): string {
  const normalizedExplicit = normalizeText(explicitValue);
  if (normalizedExplicit) return normalizedExplicit;
  const match = lexicon.find((entry) => entry.pattern.test(text));
  if (match) {
    match.pattern.lastIndex = 0;
    return match.name;
  }
  return fallback;
}

function inferCountry(article: ExecutiveSummaryArticle, text: string): string {
  const explicit = normalizeText(article.country);
  if (explicit) return titleCase(explicit);
  const match = uniqueMatches(text, COUNTRY_LEXICON)[0];
  return match ?? DEFAULT_COUNTRY;
}

function inferRegion(article: ExecutiveSummaryArticle, text: string, country: string): string {
  const explicit = normalizeText(article.region);
  if (explicit) return titleCase(explicit);

  const regionMatch = uniqueMatches(text, REGION_PATTERNS)[0];
  if (regionMatch) return regionMatch;

  const countryToRegion: Record<string, string> = {
    "United States": "North America",
    "United Kingdom": "Europe",
    Russia: "Eastern Europe",
    China: "Indo-Pacific",
    Ukraine: "Eastern Europe",
    Israel: "Middle East",
    Iran: "Middle East",
    Taiwan: "Indo-Pacific",
    "North Korea": "Indo-Pacific",
    "South Korea": "Indo-Pacific",
    India: "South Asia",
    Pakistan: "South Asia",
    "Saudi Arabia": "Middle East",
    Syria: "Middle East",
    Yemen: "Middle East",
    Lebanon: "Middle East",
    Turkey: "Europe",
    Germany: "Europe",
    France: "Europe",
    Poland: "Europe",
    Venezuela: "Latin America",
    Brazil: "Latin America",
    Mexico: "Latin America",
    Egypt: "Africa",
    Sudan: "Africa",
    Ethiopia: "Africa",
    Nigeria: "Africa",
    "South Africa": "Africa",
    Australia: "Indo-Pacific",
    Japan: "Indo-Pacific",
    Afghanistan: "South Asia",
    Iraq: "Middle East",
    Palestine: "Middle East",
    "European Union": "Europe",
    NATO: "Europe",
  };

  return countryToRegion[country] ?? DEFAULT_REGION;
}

function inferTopic(article: ExecutiveSummaryArticle, text: string): string {
  const explicit = normalizeText(article.topic);
  if (explicit) return explicit.toLowerCase();
  const match = uniqueMatches(text, TOPIC_PATTERNS)[0];
  return match ?? DEFAULT_TOPIC;
}

function normalizeArticle(article: ExecutiveSummaryArticle, index: number): NormalizedArticle {
  const title = normalizeText(article.title);
  const description = normalizeText(article.description);
  const text = `${title} ${description}`.trim();
  const country = inferCountry(article, text);
  const region = inferRegion(article, text, country);
  const topic = inferTopic(article, text);
  const riskScore =
    article.riskScore !== undefined ? clampRiskScore(article.riskScore) : scoreRiskFromText(text);

  return {
    title,
    description,
    country,
    region,
    topic,
    riskScore,
    index,
    text,
  };
}

function sortByRiskThenOrder(a: NormalizedArticle, b: NormalizedArticle): number {
  return b.riskScore - a.riskScore || a.index - b.index || a.title.localeCompare(b.title);
}

function accumulateCounts(
  articles: NormalizedArticle[],
  resolveValues: (article: NormalizedArticle) => string[],
): Map<string, WeightedCount> {
  const stats = new Map<string, WeightedCount>();

  for (const article of articles) {
    const values = new Set(
      resolveValues(article)
        .map((value) => normalizeText(value))
        .filter(Boolean),
    );

    for (const label of values) {
      const current = stats.get(label) ?? {
        label,
        count: 0,
        riskTotal: 0,
        firstIndex: article.index,
      };
      current.count += 1;
      current.riskTotal += article.riskScore;
      current.firstIndex = Math.min(current.firstIndex, article.index);
      stats.set(label, current);
    }
  }

  return stats;
}

function rankWeightedEntries(entries: Iterable<WeightedCount>): WeightedCount[] {
  return [...entries].sort(
    (a, b) =>
      b.count - a.count ||
      b.riskTotal - a.riskTotal ||
      a.firstIndex - b.firstIndex ||
      a.label.localeCompare(b.label),
  );
}

function phraseForTopic(topic: string): string {
  const normalized = normalizeText(topic);
  if (!normalized) return "Geopolitical";
  if (normalized.includes(" and ")) return normalized.split(" and ").map(titleCase).join(" and ");
  return titleCase(normalized);
}

function buildSummarySentenceSet(metrics: ExecutiveSummaryMetrics): string {
  const regionSentence =
    metrics.secondaryRegion &&
    metrics.secondaryRegion !== metrics.highestRiskRegion &&
    metrics.secondaryRegion !== DEFAULT_REGION
      ? `Global geopolitical activity remains focused on ${metrics.highestRiskRegion} and ${metrics.secondaryRegion}.`
      : `Global geopolitical activity remains focused on ${metrics.highestRiskRegion}.`;

  const countrySentence =
    metrics.mostMentionedCountry === DEFAULT_COUNTRY
      ? "Country references remain diffuse across current developments."
      : `${metrics.mostMentionedCountry} is the most frequently referenced country across current developments.`;

  const topicSentence = `${phraseForTopic(metrics.mostCommonTopic)} activity remains the dominant theme, with several articles indicating elevated tensions and increased strategic engagement across key regions.`;

  return [regionSentence, countrySentence, topicSentence].join("\n\n");
}

export function buildExecutiveSummaryMetrics(
  articles: readonly ExecutiveSummaryArticle[],
): ExecutiveSummaryMetrics {
  const normalized = articles
    .map((article, index) => normalizeArticle(article, index))
    .filter(
      (article) =>
        article.title ||
        article.description ||
        article.country ||
        article.region ||
        article.topic ||
        article.riskScore > 0,
    )
    .sort(sortByRiskThenOrder)
    .slice(0, 5);

  if (normalized.length === 0) {
    return {
      mostMentionedCountry: DEFAULT_COUNTRY,
      highestRiskRegion: DEFAULT_REGION,
      secondaryRegion: DEFAULT_REGION,
      mostCommonTopic: DEFAULT_TOPIC,
      topArticleCount: 0,
    };
  }

  const countryStats = accumulateCounts(normalized, (article) => [
    article.country,
    ...uniqueMatches(article.text, COUNTRY_LEXICON),
  ]);
  const regionStats = accumulateCounts(normalized, (article) => [article.region]);
  const topicStats = accumulateCounts(normalized, (article) => [article.topic]);

  const topCountries = rankWeightedEntries(countryStats.values());
  const topRegions = rankWeightedEntries(regionStats.values());
  const topTopics = rankWeightedEntries(topicStats.values());

  const highestRiskRegion = topRegions[0]?.label ?? DEFAULT_REGION;
  const secondaryRegion =
    topRegions.find((entry) => entry.label !== highestRiskRegion)?.label ?? DEFAULT_REGION;
  const mostMentionedCountry = topCountries[0]?.label ?? DEFAULT_COUNTRY;
  const mostCommonTopic =
    topTopics.length > 1 && topTopics[0].count === topTopics[1].count
      ? `${topTopics[0].label} and ${topTopics[1].label}`
      : (topTopics[0]?.label ?? DEFAULT_TOPIC);

  return {
    mostMentionedCountry,
    highestRiskRegion,
    secondaryRegion,
    mostCommonTopic,
    topArticleCount: normalized.length,
  };
}

export function generateExecutiveSummary(
  articles: readonly ExecutiveSummaryArticle[],
): ExecutiveSummaryResult {
  const metrics = buildExecutiveSummaryMetrics(articles);
  return {
    metrics,
    summary: buildSummarySentenceSet(metrics),
  };
}

export function toExecutiveSummaryArticleFromNewsItem(article: {
  title: string;
  summary?: string;
  region?: string;
  severity?: "low" | "medium" | "high" | "critical";
}): ExecutiveSummaryArticle {
  const severityRiskMap: Record<NonNullable<typeof article.severity>, number> = {
    low: 25,
    medium: 50,
    high: 75,
    critical: 92,
  };

  return {
    title: article.title,
    description: article.summary ?? "",
    region: article.region,
    riskScore: article.severity ? severityRiskMap[article.severity] : undefined,
  };
}
