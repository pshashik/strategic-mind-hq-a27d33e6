import { formatRelative } from "@/lib/news-service";

export type RiskMapBand = "low" | "medium" | "high";
export type RiskFactor = "war" | "attack" | "missile" | "military" | "sanctions" | "tensions";

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
  latestHeadline: string;
  rawScore: number;
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
  {
    code2: "US",
    code3: "USA",
    name: "United States",
    region: "North America",
    pattern: /\b(united states|u\.s\.|usa|american|washington|pentagon|white house)\b/gi,
  },
  {
    code2: "UK",
    code3: "GBR",
    name: "United Kingdom",
    region: "Europe",
    pattern: /\b(united kingdom|britain|british|london|westminster|gbr)\b/gi,
  },
  {
    code2: "RU",
    code3: "RUS",
    name: "Russia",
    region: "Eurasia",
    pattern: /\b(russia|russian|moscow|kremlin)\b/gi,
  },
  {
    code2: "CN",
    code3: "CHN",
    name: "China",
    region: "Asia-Pacific",
    pattern: /\b(china|chinese|beijing|shanghai)\b/gi,
  },
  {
    code2: "UA",
    code3: "UKR",
    name: "Ukraine",
    region: "Europe",
    pattern: /\b(ukraine|ukrainian|kyiv|kiev|donbas|crimea)\b/gi,
  },
  {
    code2: "IL",
    code3: "ISR",
    name: "Israel",
    region: "Middle East",
    pattern: /\b(israel|israeli|tel aviv|jerusalem|gaza|hamas|hezbollah|netanyahu)\b/gi,
  },
  {
    code2: "IR",
    code3: "IRN",
    name: "Iran",
    region: "Middle East",
    pattern: /\b(iran|iranian|tehran)\b/gi,
  },
  {
    code2: "TW",
    code3: "TWN",
    name: "Taiwan",
    region: "Asia-Pacific",
    pattern: /\b(taiwan|taiwanese|taipei)\b/gi,
  },
  {
    code2: "KP",
    code3: "PRK",
    name: "North Korea",
    region: "Asia-Pacific",
    pattern: /\b(north korea|pyongyang|dprk)\b/gi,
  },
  {
    code2: "KR",
    code3: "KOR",
    name: "South Korea",
    region: "Asia-Pacific",
    pattern: /\b(south korea|seoul)\b/gi,
  },
  {
    code2: "IN",
    code3: "IND",
    name: "India",
    region: "Asia-Pacific",
    pattern: /\b(india|indian|delhi|mumbai|new delhi)\b/gi,
  },
  {
    code2: "PK",
    code3: "PAK",
    name: "Pakistan",
    region: "Asia-Pacific",
    pattern: /\b(pakistan|pakistani|islamabad)\b/gi,
  },
  {
    code2: "SA",
    code3: "SAU",
    name: "Saudi Arabia",
    region: "Middle East",
    pattern: /\b(saudi arabia|saudi|riyadh)\b/gi,
  },
  {
    code2: "SY",
    code3: "SYR",
    name: "Syria",
    region: "Middle East",
    pattern: /\b(syria|syrian|damascus|assad)\b/gi,
  },
  {
    code2: "YE",
    code3: "YEM",
    name: "Yemen",
    region: "Middle East",
    pattern: /\b(yemen|yemeni|houthi|sanaa)\b/gi,
  },
  {
    code2: "LB",
    code3: "LBN",
    name: "Lebanon",
    region: "Middle East",
    pattern: /\b(lebanon|lebanese|beirut)\b/gi,
  },
  {
    code2: "TR",
    code3: "TUR",
    name: "Turkey",
    region: "Europe/Middle East",
    pattern: /\b(turkey|turkish|ankara|istanbul|erdogan)\b/gi,
  },
  {
    code2: "DE",
    code3: "DEU",
    name: "Germany",
    region: "Europe",
    pattern: /\b(germany|german|berlin)\b/gi,
  },
  {
    code2: "FR",
    code3: "FRA",
    name: "France",
    region: "Europe",
    pattern: /\b(france|french|paris|macron)\b/gi,
  },
  {
    code2: "PL",
    code3: "POL",
    name: "Poland",
    region: "Europe",
    pattern: /\b(poland|polish|warsaw)\b/gi,
  },
  {
    code2: "VE",
    code3: "VEN",
    name: "Venezuela",
    region: "South America",
    pattern: /\b(venezuela|venezuelan|caracas|maduro)\b/gi,
  },
  {
    code2: "BR",
    code3: "BRA",
    name: "Brazil",
    region: "South America",
    pattern: /\b(brazil|brazilian|brasilia|brasil)\b/gi,
  },
  {
    code2: "MX",
    code3: "MEX",
    name: "Mexico",
    region: "North America",
    pattern: /\b(mexico|mexican|mexico city)\b/gi,
  },
  {
    code2: "EG",
    code3: "EGY",
    name: "Egypt",
    region: "Middle East",
    pattern: /\b(egypt|egyptian|cairo)\b/gi,
  },
  {
    code2: "SD",
    code3: "SDN",
    name: "Sudan",
    region: "Africa",
    pattern: /\b(sudan|sudanese|khartoum)\b/gi,
  },
  {
    code2: "ET",
    code3: "ETH",
    name: "Ethiopia",
    region: "Africa",
    pattern: /\b(ethiopia|ethiopian|addis ababa)\b/gi,
  },
  {
    code2: "NG",
    code3: "NGA",
    name: "Nigeria",
    region: "Africa",
    pattern: /\b(nigeria|nigerian|abuja|lagos)\b/gi,
  },
  {
    code2: "ZA",
    code3: "ZAF",
    name: "South Africa",
    region: "Africa",
    pattern: /\b(south africa|south african|pretoria|johannesburg)\b/gi,
  },
  {
    code2: "AU",
    code3: "AUS",
    name: "Australia",
    region: "Asia-Pacific",
    pattern: /\b(australia|australian|canberra|sydney)\b/gi,
  },
  {
    code2: "JP",
    code3: "JPN",
    name: "Japan",
    region: "Asia-Pacific",
    pattern: /\b(japan|japanese|tokyo)\b/gi,
  },
  {
    code2: "AF",
    code3: "AFG",
    name: "Afghanistan",
    region: "Asia-Pacific",
    pattern: /\b(afghanistan|afghan|kabul|taliban)\b/gi,
  },
  {
    code2: "IQ",
    code3: "IRQ",
    name: "Iraq",
    region: "Middle East",
    pattern: /\b(iraq|iraqi|baghdad)\b/gi,
  },
  {
    code2: "PS",
    code3: "PSE",
    name: "Palestine",
    region: "Middle East",
    pattern: /\b(palestine|palestinian|west bank|gaza)\b/gi,
  },
  {
    code2: "CA",
    code3: "CAN",
    name: "Canada",
    region: "North America",
    pattern: /\b(canada|canadian|ottawa|toronto)\b/gi,
  },
  {
    code2: "ES",
    code3: "ESP",
    name: "Spain",
    region: "Europe",
    pattern: /\b(spain|spanish|madrid)\b/gi,
  },
  {
    code2: "IT",
    code3: "ITA",
    name: "Italy",
    region: "Europe",
    pattern: /\b(italy|italian|rome)\b/gi,
  },
  {
    code2: "AR",
    code3: "ARG",
    name: "Argentina",
    region: "South America",
    pattern: /\b(argentina|argentine|buenos aires)\b/gi,
  },
  {
    code2: "BD",
    code3: "BGD",
    name: "Bangladesh",
    region: "Asia-Pacific",
    pattern: /\b(bangladesh|bangladeshi|dhaka)\b/gi,
  },
  {
    code2: "BE",
    code3: "BEL",
    name: "Belgium",
    region: "Europe",
    pattern: /\b(belgium|belgian|brussels)\b/gi,
  },
  {
    code2: "BO",
    code3: "BOL",
    name: "Bolivia",
    region: "South America",
    pattern: /\b(bolivia|bolivian|la paz)\b/gi,
  },
  {
    code2: "CL",
    code3: "CHL",
    name: "Chile",
    region: "South America",
    pattern: /\b(chile|chilean|santiago)\b/gi,
  },
  {
    code2: "CO",
    code3: "COL",
    name: "Colombia",
    region: "South America",
    pattern: /\b(colombia|colombian|bogota)\b/gi,
  },
  {
    code2: "CU",
    code3: "CUB",
    name: "Cuba",
    region: "North America",
    pattern: /\b(cuba|cuban|havana)\b/gi,
  },
  {
    code2: "DK",
    code3: "DNK",
    name: "Denmark",
    region: "Europe",
    pattern: /\b(denmark|danish|copenhagen)\b/gi,
  },
  {
    code2: "FI",
    code3: "FIN",
    name: "Finland",
    region: "Europe",
    pattern: /\b(finland|finnish|helsinki)\b/gi,
  },
  {
    code2: "GE",
    code3: "GEO",
    name: "Georgia",
    region: "Eurasia",
    pattern: /\b(georgia|georgian|tbilisi)\b/gi,
  },
  {
    code2: "GR",
    code3: "GRC",
    name: "Greece",
    region: "Europe",
    pattern: /\b(greece|greek|athens)\b/gi,
  },
  {
    code2: "ID",
    code3: "IDN",
    name: "Indonesia",
    region: "Asia-Pacific",
    pattern: /\b(indonesia|indonesian|jakarta)\b/gi,
  },
  {
    code2: "IE",
    code3: "IRL",
    name: "Ireland",
    region: "Europe",
    pattern: /\b(ireland|irish|dublin)\b/gi,
  },
  {
    code2: "JO",
    code3: "JOR",
    name: "Jordan",
    region: "Middle East",
    pattern: /\b(jordan|jordanian|amman)\b/gi,
  },
  {
    code2: "KE",
    code3: "KEN",
    name: "Kenya",
    region: "Africa",
    pattern: /\b(kenya|kenyan|nairobi)\b/gi,
  },
  {
    code2: "KW",
    code3: "KWT",
    name: "Kuwait",
    region: "Middle East",
    pattern: /\b(kuwait|kuwaiti)\b/gi,
  },
  {
    code2: "LY",
    code3: "LBY",
    name: "Libya",
    region: "Africa",
    pattern: /\b(libya|libyan|tripoli)\b/gi,
  },
  {
    code2: "MA",
    code3: "MAR",
    name: "Morocco",
    region: "Africa",
    pattern: /\b(morocco|moroccan|rabat)\b/gi,
  },
  {
    code2: "MM",
    code3: "MMR",
    name: "Myanmar",
    region: "Asia-Pacific",
    pattern: /\b(myanmar|burma|burmese|naypyidaw)\b/gi,
  },
  {
    code2: "MY",
    code3: "MYS",
    name: "Malaysia",
    region: "Asia-Pacific",
    pattern: /\b(malaysia|malaysian|kuala lumpur)\b/gi,
  },
  {
    code2: "NL",
    code3: "NLD",
    name: "Netherlands",
    region: "Europe",
    pattern: /\b(netherlands|dutch|amsterdam|the hague)\b/gi,
  },
  {
    code2: "NO",
    code3: "NOR",
    name: "Norway",
    region: "Europe",
    pattern: /\b(norway|norwegian|oslo)\b/gi,
  },
  {
    code2: "NZ",
    code3: "NZL",
    name: "New Zealand",
    region: "Asia-Pacific",
    pattern: /\b(new zealand|new zealander|wellington)\b/gi,
  },
  {
    code2: "OM",
    code3: "OMN",
    name: "Oman",
    region: "Middle East",
    pattern: /\b(oman|omani|muscat)\b/gi,
  },
  {
    code2: "PE",
    code3: "PER",
    name: "Peru",
    region: "South America",
    pattern: /\b(peru|peruvian|lima)\b/gi,
  },
  {
    code2: "PH",
    code3: "PHL",
    name: "Philippines",
    region: "Asia-Pacific",
    pattern: /\b(philippines|philippine|filipino|manila)\b/gi,
  },
  {
    code2: "QA",
    code3: "QAT",
    name: "Qatar",
    region: "Middle East",
    pattern: /\b(qatar|qatari|doha)\b/gi,
  },
  {
    code2: "RO",
    code3: "ROU",
    name: "Romania",
    region: "Europe",
    pattern: /\b(romania|romanian|bucharest)\b/gi,
  },
  {
    code2: "RS",
    code3: "SRB",
    name: "Serbia",
    region: "Europe",
    pattern: /\b(serbia|serbian|belgrade)\b/gi,
  },
  {
    code2: "SE",
    code3: "SWE",
    name: "Sweden",
    region: "Europe",
    pattern: /\b(sweden|swedish|stockholm)\b/gi,
  },
  {
    code2: "SG",
    code3: "SGP",
    name: "Singapore",
    region: "Asia-Pacific",
    pattern: /\b(singapore|singaporean)\b/gi,
  },
  {
    code2: "TH",
    code3: "THA",
    name: "Thailand",
    region: "Asia-Pacific",
    pattern: /\b(thailand|thai|bangkok)\b/gi,
  },
  {
    code2: "UG",
    code3: "UGA",
    name: "Uganda",
    region: "Africa",
    pattern: /\b(uganda|ugandan|kampala)\b/gi,
  },
  {
    code2: "AE",
    code3: "ARE",
    name: "United Arab Emirates",
    region: "Middle East",
    pattern: /\b(united arab emirates|uae|emirati|abu dhabi|dubai)\b/gi,
  },
  {
    code2: "VN",
    code3: "VNM",
    name: "Vietnam",
    region: "Asia-Pacific",
    pattern: /\b(vietnam|vietnamese|hanoi)\b/gi,
  },
  {
    code2: "ZW",
    code3: "ZWE",
    name: "Zimbabwe",
    region: "Africa",
    pattern: /\b(zimbabwe|zimbabwean|harare)\b/gi,
  },
];

export const RISK_FACTOR_WEIGHTS: Record<RiskFactor, number> = {
  war: 5,
  attack: 4,
  missile: 4,
  military: 3,
  sanctions: 2,
  tensions: 1,
};

const RISK_FACTOR_PATTERNS: Record<RiskFactor, RegExp> = {
  war: /\b(war|wars|warfare)\b/gi,
  attack: /\b(attack|attacks|attacked|attacking|assault|strike|strikes)\b/gi,
  missile: /\b(missile|missiles|rocket|rockets|drone|drones)\b/gi,
  military: /\b(military|troop|troops|army|navy|air force|deployment|deployed)\b/gi,
  sanctions: /\b(sanction|sanctions|embargo|embargoes|blacklist|blacklisted)\b/gi,
  tensions: /\b(tension|tensions|standoff|dispute|escalation|clash|crisis)\b/gi,
};

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

function countMatches(text: string, pattern: RegExp): number {
  pattern.lastIndex = 0;
  return (text.match(pattern) ?? []).length;
}

function scoreArticle(text: string): { score: number; factors: Map<RiskFactor, number> } {
  const factors = new Map<RiskFactor, number>();
  let score = 0;

  for (const factor of Object.keys(RISK_FACTOR_WEIGHTS) as RiskFactor[]) {
    const count = countMatches(text, RISK_FACTOR_PATTERNS[factor]);
    if (count === 0) continue;
    factors.set(factor, count);
    score += count * RISK_FACTOR_WEIGHTS[factor];
  }

  return { score, factors };
}

function formatFactorName(factor: RiskFactor): string {
  return factor.charAt(0).toUpperCase() + factor.slice(1);
}

export function computeGlobalRiskMap(articles: FeedArticle[]): MapCountryRisk[] {
  const aggregatedStats = new Map<
    string,
    {
      aggregatedScore: number;
      articleCount: number;
      developments: { date: string; headline: string }[];
      riskFactors: Map<RiskFactor, number>;
      latestPubDate: number;
      latestHeadline: string;
    }
  >();

  // Initialize
  for (const c of COUNTRY_DATABASE) {
    aggregatedStats.set(c.code2, {
      aggregatedScore: 0,
      articleCount: 0,
      developments: [],
      riskFactors: new Map<RiskFactor, number>(),
      latestPubDate: 0,
      latestHeadline: "",
    });
  }

  // Aggregate scores and metadata from articles
  for (const article of articles) {
    const text = `${article.title} ${article.summary ?? ""}`;
    const { score: articleScore, factors } = scoreArticle(text);

    if (articleScore === 0) continue;

    // Scan for country mentions
    for (const c of COUNTRY_DATABASE) {
      // Reset lastIndex for global regexp
      c.pattern.lastIndex = 0;
      if (c.pattern.test(text)) {
        const stats = aggregatedStats.get(c.code2)!;
        stats.aggregatedScore += articleScore;
        stats.articleCount += 1;

        for (const [factor, count] of factors) {
          stats.riskFactors.set(factor, (stats.riskFactors.get(factor) ?? 0) + count);
        }

        stats.developments.push({
          date: article.pubDate ? formatRelative(article.pubDate) : "Recent",
          headline: article.title,
        });
        if ((article.pubDate ?? 0) >= stats.latestPubDate) {
          stats.latestPubDate = article.pubDate ?? 0;
          stats.latestHeadline = article.title;
        }
      }
    }
  }

  // Construct MapCountryRisk array, normalized to a stable 0-10 scale.
  return COUNTRY_DATABASE.map((c) => {
    const stats = aggregatedStats.get(c.code2)!;

    const riskScore = Math.max(0, Math.min(10, Math.round(stats.aggregatedScore)));
    const band = riskBandFromScore(riskScore);
    const topRiskFactors = [...stats.riskFactors.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([factor]) => formatFactorName(factor));

    return {
      code: c.code2,
      code3: c.code3,
      name: c.name,
      region: c.region,
      x: 0,
      y: 0,
      riskScore,
      band,
      developments: stats.developments.slice(0, 3),
      articleCount: stats.articleCount,
      topRiskFactors,
      latestHeadline: stats.latestHeadline,
      rawScore: stats.aggregatedScore,
    };
  });
}
