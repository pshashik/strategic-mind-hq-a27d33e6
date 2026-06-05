export type RiskLevel = "low" | "medium" | "high" | "critical";

export interface NewsItem {
  id: string;
  title: string;
  region: string;
  source: string;
  time: string;
  severity: RiskLevel;
  summary: string;
}

export const breakingNews: NewsItem[] = [
  {
    id: "1",
    title: "Naval Standoff Escalates in South China Sea",
    region: "Asia-Pacific",
    source: "Reuters",
    time: "12 min ago",
    severity: "high",
    summary: "Three vessels engaged in close-range maneuvering near disputed Spratly reefs as regional powers issue statements.",
  },
  {
    id: "2",
    title: "EU Announces 14th Sanctions Package on Russia",
    region: "Europe",
    source: "Financial Times",
    time: "34 min ago",
    severity: "medium",
    summary: "New package targets LNG transshipments and shadow fleet operations, signaling tighter enforcement.",
  },
  {
    id: "3",
    title: "Gaza Ceasefire Talks Stall in Doha",
    region: "Middle East",
    source: "Al Jazeera",
    time: "1 hr ago",
    severity: "critical",
    summary: "Negotiators report fundamental disagreements over phase-two terms; humanitarian corridors at risk.",
  },
  {
    id: "4",
    title: "Sahel Coup Aftershocks Disrupt Uranium Supply",
    region: "Africa",
    source: "Bloomberg",
    time: "2 hrs ago",
    severity: "high",
    summary: "Niger junta renegotiates extraction contracts, prompting price spikes across European nuclear markets.",
  },
  {
    id: "5",
    title: "Taiwan Conducts Cross-Service Live-Fire Drills",
    region: "Asia-Pacific",
    source: "AP",
    time: "3 hrs ago",
    severity: "medium",
    summary: "Han Kuang exercises emphasize resilience and gray-zone deterrence.",
  },
  {
    id: "6",
    title: "Arctic Council Meeting Postponed Amid Tensions",
    region: "Arctic",
    source: "AFP",
    time: "5 hrs ago",
    severity: "low",
    summary: "Scheduling dispute reflects deeper rifts over Russian observer status.",
  },
];

export const topRisks = [
  { id: "r1", title: "Strait of Hormuz disruption", probability: 64, impact: "Critical" },
  { id: "r2", title: "Taiwan Strait escalation", probability: 38, impact: "Critical" },
  { id: "r3", title: "European energy price shock", probability: 52, impact: "High" },
  { id: "r4", title: "Sub-Saharan instability spillover", probability: 71, impact: "High" },
  { id: "r5", title: "Cyber attack on financial infrastructure", probability: 46, impact: "High" },
];

export const trendingCountries = [
  { code: "IL", name: "Israel", change: "+18%", risk: "critical" as RiskLevel },
  { code: "TW", name: "Taiwan", change: "+12%", risk: "high" as RiskLevel },
  { code: "RU", name: "Russia", change: "+9%", risk: "high" as RiskLevel },
  { code: "IR", name: "Iran", change: "+24%", risk: "critical" as RiskLevel },
  { code: "VE", name: "Venezuela", change: "+6%", risk: "medium" as RiskLevel },
  { code: "KP", name: "North Korea", change: "+4%", risk: "high" as RiskLevel },
];

export const strategicAlerts = [
  { id: "a1", title: "Unusual troop movements detected — Eastern Ukraine border", level: "critical" as RiskLevel, time: "8m" },
  { id: "a2", title: "Currency intervention by PBOC exceeds 3σ threshold", level: "high" as RiskLevel, time: "41m" },
  { id: "a3", title: "Diplomatic cable references new mediator in Yemen", level: "medium" as RiskLevel, time: "2h" },
  { id: "a4", title: "Satellite imagery: port construction activity, Djibouti", level: "medium" as RiskLevel, time: "5h" },
];

export interface Country {
  code: string;
  name: string;
  region: string;
  riskScore: number;
  risk: RiskLevel;
  allies: string[];
  rivals: string[];
  developments: { date: string; headline: string }[];
  // approximate lat/lng for map plotting (percent of viewbox)
  x: number;
  y: number;
}

export const countries: Country[] = [
  { code: "US", name: "United States", region: "North America", riskScore: 32, risk: "medium", allies: ["UK", "Canada", "Japan", "Australia", "Germany"], rivals: ["Russia", "China", "Iran", "North Korea"], developments: [
    { date: "Today", headline: "Treasury expands secondary sanctions framework" },
    { date: "Yesterday", headline: "Senate advances defense authorization bill" },
    { date: "2 days ago", headline: "USTR opens Section 301 review on critical minerals" },
  ], x: 22, y: 38 },
  { code: "CN", name: "China", region: "Asia-Pacific", riskScore: 68, risk: "high", allies: ["Russia", "Pakistan", "Iran", "North Korea"], rivals: ["United States", "India", "Japan", "Taiwan"], developments: [
    { date: "Today", headline: "PBOC intervenes to support yuan amid capital outflows" },
    { date: "Today", headline: "Joint naval patrol announced with Russian Pacific Fleet" },
    { date: "Yesterday", headline: "New export controls on gallium and germanium" },
  ], x: 75, y: 42 },
  { code: "RU", name: "Russia", region: "Eurasia", riskScore: 84, risk: "critical", allies: ["China", "Belarus", "Iran", "North Korea"], rivals: ["United States", "UK", "Germany", "Ukraine"], developments: [
    { date: "Today", headline: "Mobilization decree expands eligible age brackets" },
    { date: "Yesterday", headline: "Shadow fleet rerouted via West African ports" },
  ], x: 60, y: 28 },
  { code: "IL", name: "Israel", region: "Middle East", riskScore: 88, risk: "critical", allies: ["United States", "Germany", "UK"], rivals: ["Iran", "Syria", "Lebanon (Hezbollah)"], developments: [
    { date: "Today", headline: "Doha talks stall over phase-two terms" },
    { date: "Today", headline: "Northern front exchange-of-fire intensifies" },
  ], x: 56, y: 46 },
  { code: "IR", name: "Iran", region: "Middle East", riskScore: 81, risk: "critical", allies: ["Russia", "China", "Syria"], rivals: ["United States", "Israel", "Saudi Arabia"], developments: [
    { date: "Today", headline: "Enrichment levels reported above 84% at Fordow" },
    { date: "Yesterday", headline: "IRGC announces new naval exercise zone" },
  ], x: 61, y: 45 },
  { code: "TW", name: "Taiwan", region: "Asia-Pacific", riskScore: 72, risk: "high", allies: ["United States", "Japan", "Lithuania"], rivals: ["China"], developments: [
    { date: "Today", headline: "Han Kuang drills emphasize gray-zone resilience" },
    { date: "Yesterday", headline: "Cabinet approves supplemental defense budget" },
  ], x: 79, y: 48 },
  { code: "UA", name: "Ukraine", region: "Europe", riskScore: 79, risk: "critical", allies: ["United States", "EU", "UK", "Poland"], rivals: ["Russia"], developments: [
    { date: "Today", headline: "Long-range drone strikes hit two Black Sea ports" },
    { date: "Yesterday", headline: "ATACMS deployments expand to southern axis" },
  ], x: 56, y: 33 },
  { code: "DE", name: "Germany", region: "Europe", riskScore: 28, risk: "medium", allies: ["France", "United States", "EU"], rivals: ["Russia"], developments: [
    { date: "Today", headline: "Coalition debates Bundeswehr expansion timeline" },
  ], x: 51, y: 32 },
  { code: "IN", name: "India", region: "South Asia", riskScore: 41, risk: "medium", allies: ["United States", "France", "Israel", "Russia"], rivals: ["China", "Pakistan"], developments: [
    { date: "Today", headline: "Border patrol exchanges reported in Ladakh" },
  ], x: 70, y: 48 },
  { code: "KP", name: "North Korea", region: "Asia-Pacific", riskScore: 76, risk: "high", allies: ["Russia", "China"], rivals: ["United States", "South Korea", "Japan"], developments: [
    { date: "Today", headline: "Hypersonic glide vehicle test reported" },
  ], x: 80, y: 38 },
  { code: "BR", name: "Brazil", region: "Latin America", riskScore: 24, risk: "low", allies: ["Argentina", "China"], rivals: [], developments: [
    { date: "Today", headline: "BRICS finance ministers convene in Brasília" },
  ], x: 33, y: 65 },
  { code: "ZA", name: "South Africa", region: "Africa", riskScore: 35, risk: "medium", allies: ["China", "Russia", "India"], rivals: [], developments: [
    { date: "Today", headline: "AGOA renewal negotiations stall" },
  ], x: 54, y: 72 },
  { code: "VE", name: "Venezuela", region: "Latin America", riskScore: 58, risk: "medium", allies: ["Russia", "Iran", "Cuba"], rivals: ["United States", "Colombia"], developments: [
    { date: "Today", headline: "Essequibo border tensions resurface with Guyana" },
  ], x: 30, y: 58 },
  { code: "UK", name: "United Kingdom", region: "Europe", riskScore: 22, risk: "low", allies: ["United States", "EU", "Australia"], rivals: ["Russia"], developments: [
    { date: "Today", headline: "MOD increases Red Sea naval presence" },
  ], x: 48, y: 30 },
];

export const executiveSummary = {
  generated: "Today, 09:14 UTC",
  body: "Global risk posture remains elevated across three theaters. The Middle East continues to dominate strategic attention as Doha negotiations show signs of structural failure, while Iran's enrichment milestones narrow the diplomatic window. In Asia-Pacific, Chinese naval activity around contested features has reached a six-month high, coinciding with Taiwan's Han Kuang drills. European energy markets are absorbing the EU's 14th sanctions package with moderate volatility, but secondary effects on shadow-fleet routing through West Africa are creating new chokepoints. Recommend elevated monitoring on Hormuz, Bab el-Mandeb, and Taiwan Strait corridors over the next 72 hours.",
  metrics: [
    { label: "Active Conflicts", value: "37" },
    { label: "Critical Alerts", value: "12" },
    { label: "Countries Monitored", value: "194" },
    { label: "Sources Today", value: "2,418" },
  ],
};
