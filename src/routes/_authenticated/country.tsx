import { createFileRoute } from "@tanstack/react-router";
import { AppLayout, riskColor } from "@/components/AppLayout";
import { useArticles } from "@/hooks/use-articles";
import { computeTrendingCountries } from "@/lib/countries.functions";
import { formatRelative, type NewsItem } from "@/lib/news-service";
import { Skeleton } from "@/components/ui/skeleton";
import { useEffect, useMemo, useState } from "react";
import { Search, Flag, Activity, FileText, AlertTriangle, ExternalLink } from "lucide-react";
import type { RiskLevel } from "@/lib/mock-data";

export const Route = createFileRoute("/country")({
  head: () => ({ meta: [{ title: "Country Intelligence — StrategicMind AI" }] }),
  validateSearch: (search: Record<string, unknown>) => ({
    code: typeof search.code === "string" ? search.code.toUpperCase() : undefined,
  }),
  component: CountryPage,
});

const COUNTRY_PATTERNS: { code: string; name: string; pattern: RegExp }[] = [
  {
    code: "US",
    name: "United States",
    pattern: /\b(united states|u\.s\.|usa|american|washington|pentagon|white house)\b/i,
  },
  {
    code: "UK",
    name: "United Kingdom",
    pattern: /\b(united kingdom|britain|british|london|westminster)\b/i,
  },
  { code: "RU", name: "Russia", pattern: /\b(russia|russian|moscow|kremlin)\b/i },
  { code: "CN", name: "China", pattern: /\b(china|chinese|beijing|shanghai)\b/i },
  { code: "UA", name: "Ukraine", pattern: /\b(ukraine|ukrainian|kyiv|kiev|donbas|crimea)\b/i },
  {
    code: "IL",
    name: "Israel",
    pattern: /\b(israel|israeli|tel aviv|jerusalem|gaza|hamas|hezbollah|netanyahu)\b/i,
  },
  { code: "IR", name: "Iran", pattern: /\b(iran|iranian|tehran)\b/i },
  { code: "TW", name: "Taiwan", pattern: /\b(taiwan|taiwanese|taipei)\b/i },
  { code: "KP", name: "North Korea", pattern: /\b(north korea|pyongyang|dprk)\b/i },
  { code: "KR", name: "South Korea", pattern: /\b(south korea|seoul)\b/i },
  { code: "IN", name: "India", pattern: /\b(india|indian|delhi|mumbai|new delhi)\b/i },
  { code: "PK", name: "Pakistan", pattern: /\b(pakistan|pakistani|islamabad)\b/i },
  { code: "SA", name: "Saudi Arabia", pattern: /\b(saudi arabia|saudi|riyadh)\b/i },
  { code: "SY", name: "Syria", pattern: /\b(syria|syrian|damascus|assad)\b/i },
  { code: "YE", name: "Yemen", pattern: /\b(yemen|yemeni|houthi|sanaa)\b/i },
  { code: "LB", name: "Lebanon", pattern: /\b(lebanon|lebanese|beirut)\b/i },
  { code: "TR", name: "Turkey", pattern: /\b(turkey|turkish|ankara|istanbul|erdogan)\b/i },
  { code: "DE", name: "Germany", pattern: /\b(germany|german|berlin)\b/i },
  { code: "FR", name: "France", pattern: /\b(france|french|paris|macron)\b/i },
  { code: "PL", name: "Poland", pattern: /\b(poland|polish|warsaw)\b/i },
  { code: "VE", name: "Venezuela", pattern: /\b(venezuela|venezuelan|caracas|maduro)\b/i },
  { code: "BR", name: "Brazil", pattern: /\b(brazil|brazilian|brasilia|brasil)\b/i },
  { code: "MX", name: "Mexico", pattern: /\b(mexico|mexican|mexico city)\b/i },
  { code: "EG", name: "Egypt", pattern: /\b(egypt|egyptian|cairo)\b/i },
  { code: "SD", name: "Sudan", pattern: /\b(sudan|sudanese|khartoum)\b/i },
  { code: "ET", name: "Ethiopia", pattern: /\b(ethiopia|ethiopian|addis ababa)\b/i },
  { code: "NG", name: "Nigeria", pattern: /\b(nigeria|nigerian|abuja|lagos)\b/i },
  {
    code: "ZA",
    name: "South Africa",
    pattern: /\b(south africa|south african|pretoria|johannesburg)\b/i,
  },
  { code: "AU", name: "Australia", pattern: /\b(australia|australian|canberra|sydney)\b/i },
  { code: "JP", name: "Japan", pattern: /\b(japan|japanese|tokyo)\b/i },
  { code: "AF", name: "Afghanistan", pattern: /\b(afghanistan|afghan|kabul|taliban)\b/i },
  { code: "IQ", name: "Iraq", pattern: /\b(iraq|iraqi|baghdad)\b/i },
  { code: "PS", name: "Palestine", pattern: /\b(palestine|palestinian|west bank)\b/i },
];

const THEME_PATTERNS: { label: string; pattern: RegExp }[] = [
  {
    label: "Military Operations",
    pattern: /\b(military|troops|army|navy|airstrike|missile|drone|war|combat|offensive)\b/i,
  },
  {
    label: "Diplomatic Engagement",
    pattern: /\b(diplomatic|summit|talks|negotiat|ambassador|treaty|ceasefire)\b/i,
  },
  {
    label: "Economic Pressure",
    pattern: /\b(sanctions?|tariff|trade|embargo|currency|inflation|economy|oil|gas)\b/i,
  },
  { label: "Nuclear & WMD", pattern: /\b(nuclear|enrichment|warhead|icbm|chemical weapon)\b/i },
  {
    label: "Internal Security",
    pattern: /\b(protest|unrest|coup|insurgent|riot|crackdown|election)\b/i,
  },
  {
    label: "Cyber & Intelligence",
    pattern: /\b(cyber|hack|espionage|intelligence|surveillance)\b/i,
  },
  {
    label: "Humanitarian Crisis",
    pattern: /\b(refugee|famine|humanitarian|aid|displaced|civilian casualt)\b/i,
  },
  {
    label: "Alliance & Coalition",
    pattern: /\b(nato|allies|coalition|partnership|defense pact)\b/i,
  },
];

function riskLevelFromScore(score: number): RiskLevel {
  if (score >= 75) return "critical";
  if (score >= 50) return "high";
  if (score >= 25) return "medium";
  return "low";
}

function activityLabel(count: number): string {
  if (count >= 8) return "Very High";
  if (count >= 5) return "High";
  if (count >= 3) return "Moderate";
  if (count >= 1) return "Low";
  return "Minimal";
}

function CountryPage() {
  const { articles, loading } = useArticles();
  const { code: codeFromUrl } = Route.useSearch();
  const [q, setQ] = useState("");
  const [code, setCode] = useState<string | null>(null);

  useEffect(() => {
    if (codeFromUrl) setCode(codeFromUrl);
  }, [codeFromUrl]);

  const trending = useMemo(() => computeTrendingCountries(articles), [articles]);

  const countryList = useMemo(() => {
    return trending.map((t) => ({
      code: t.countryCode,
      name: t.countryName,
      riskScore: t.riskScore,
      risk: riskLevelFromScore(t.riskScore),
      mentions: t.mentionCount,
    }));
  }, [trending]);

  const filtered = useMemo(
    () =>
      countryList.filter(
        (c) =>
          c.name.toLowerCase().includes(q.toLowerCase()) ||
          c.code.toLowerCase().includes(q.toLowerCase()),
      ),
    [q, countryList],
  );

  const selectedCode = code ?? countryList[0]?.code ?? null;
  const selected = countryList.find((c) => c.code === selectedCode) ?? null;

  const countryArticles: NewsItem[] = useMemo(() => {
    if (!selected) return [];
    const entry = COUNTRY_PATTERNS.find((p) => p.code === selected.code);
    if (!entry) return [];
    return articles.filter((a) => entry.pattern.test(`${a.title} ${a.summary ?? ""}`));
  }, [articles, selected]);

  const themes = useMemo(() => {
    if (countryArticles.length === 0) return [] as { label: string; count: number }[];
    const counts = new Map<string, number>();
    for (const a of countryArticles) {
      const text = `${a.title} ${a.summary ?? ""}`;
      for (const t of THEME_PATTERNS) {
        if (t.pattern.test(text)) counts.set(t.label, (counts.get(t.label) ?? 0) + 1);
      }
    }
    return [...counts.entries()]
      .map(([label, count]) => ({ label, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);
  }, [countryArticles]);

  const overview = useMemo(() => {
    if (!selected || countryArticles.length === 0) return "";
    const themeText =
      themes.length > 0
        ? themes
            .slice(0, 3)
            .map((t) => t.label.toLowerCase())
            .join(", ")
        : "general developments";
    return `${selected.name} is currently surfacing across ${countryArticles.length} active intelligence ${
      countryArticles.length === 1 ? "report" : "reports"
    } in the live feed. Coverage is concentrated around ${themeText}. The composite risk score of ${selected.riskScore}/100 reflects current mention volume and volatility signals derived from open-source reporting.`;
  }, [selected, countryArticles, themes]);

  const riskAssessment = useMemo(() => {
    if (!selected || countryArticles.length === 0) return "";
    const level = selected.risk;
    const map: Record<RiskLevel, string> = {
      critical:
        "Critical exposure — sustained high-intensity reporting indicates active escalation vectors that warrant immediate analyst attention.",
      high: "Elevated exposure — meaningful concentration of strategic signals suggests an evolving situation with material downside risk.",
      medium:
        "Moderate exposure — ongoing developments visible in the feed but no acute crisis indicators at this time.",
      low: "Limited exposure — current reporting volume is low; maintain routine monitoring.",
    };
    return map[level];
  }, [selected, countryArticles]);

  return (
    <AppLayout>
      <div className="space-y-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Flag className="size-6 text-primary" /> Country Intelligence
          </h1>
          <p className="text-sm text-muted-foreground">
            Dynamic country profiles synthesized from the live intelligence feed.
          </p>
        </div>

        <div className="grid lg:grid-cols-[280px_1fr] gap-4">
          <aside className="glass-card rounded-xl p-3 h-fit">
            <div className="flex items-center gap-2 px-2 py-1.5 rounded-md bg-background/60 border border-border">
              <Search className="size-4 text-muted-foreground" />
              <input
                value={q}
                onChange={(e) => setQ(e.target.value)}
                placeholder="Search country…"
                className="flex-1 bg-transparent outline-none text-sm"
              />
            </div>
            <ul className="mt-3 max-h-[60vh] overflow-y-auto">
              {loading && countryList.length === 0 ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <li key={i} className="px-2 py-2">
                    <Skeleton className="h-8 w-full" />
                  </li>
                ))
              ) : filtered.length === 0 ? (
                <li className="px-2 py-4 text-sm text-muted-foreground text-center">
                  No countries detected in current feed.
                </li>
              ) : (
                filtered.map((c) => (
                  <li key={c.code}>
                    <button
                      onClick={() => setCode(c.code)}
                      className={`w-full text-left flex items-center gap-3 px-2 py-2 rounded-md hover:bg-accent/30 ${selectedCode === c.code ? "bg-primary/10 ring-1 ring-primary/30" : ""}`}
                    >
                      <span className="size-8 rounded-md bg-muted text-xs font-semibold flex items-center justify-center">
                        {c.code}
                      </span>
                      <span className="flex-1 text-sm">{c.name}</span>
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded border ${riskColor(c.risk)}`}
                      >
                        {c.riskScore}
                      </span>
                    </button>
                  </li>
                ))
              )}
            </ul>
          </aside>

          <div className="space-y-4">
            {!selected ? (
              <section className="glass-card rounded-xl p-6 text-sm text-muted-foreground">
                {loading ? "Loading intelligence feed…" : "No current intelligence available."}
              </section>
            ) : (
              <>
                <section className="glass-card rounded-xl p-6">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <div className="text-xs text-muted-foreground">Live Feed Synthesis</div>
                      <h2 className="text-3xl font-semibold">{selected.name}</h2>
                      <span
                        className={`mt-2 inline-block text-xs px-2 py-1 rounded border ${riskColor(selected.risk)}`}
                      >
                        {selected.risk.toUpperCase()} RISK
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-muted-foreground">Composite Risk Score</div>
                      <div className="text-5xl font-bold text-gradient leading-none">
                        {selected.riskScore}
                      </div>
                      <div className="text-[11px] text-muted-foreground">out of 100</div>
                    </div>
                  </div>
                  <div className="mt-5 h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-risk-low via-risk-medium to-risk-critical"
                      style={{ width: `${selected.riskScore}%` }}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3 mt-5">
                    <div className="p-3 rounded-md bg-background/40 border border-border/60">
                      <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <FileText className="size-3" /> Articles
                      </div>
                      <div className="text-xl font-semibold mt-1">{countryArticles.length}</div>
                    </div>
                    <div className="p-3 rounded-md bg-background/40 border border-border/60">
                      <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <Activity className="size-3" /> Activity
                      </div>
                      <div className="text-xl font-semibold mt-1">
                        {activityLabel(countryArticles.length)}
                      </div>
                    </div>
                    <div className="p-3 rounded-md bg-background/40 border border-border/60">
                      <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                        <AlertTriangle className="size-3" /> Risk Level
                      </div>
                      <div className="text-xl font-semibold mt-1 capitalize">{selected.risk}</div>
                    </div>
                  </div>
                </section>

                {countryArticles.length === 0 ? (
                  <section className="glass-card rounded-xl p-6 text-sm text-muted-foreground text-center">
                    No current intelligence available.
                  </section>
                ) : (
                  <>
                    <section className="glass-card rounded-xl p-5">
                      <h3 className="font-semibold mb-2">Country Overview</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{overview}</p>
                    </section>

                    <div className="grid md:grid-cols-2 gap-4">
                      <section className="glass-card rounded-xl p-5">
                        <h3 className="font-semibold mb-3">Strategic Themes</h3>
                        <div className="flex flex-wrap gap-2">
                          {themes.length === 0 ? (
                            <span className="text-sm text-muted-foreground">
                              No dominant themes detected.
                            </span>
                          ) : (
                            themes.map((t) => (
                              <span
                                key={t.label}
                                className="text-sm px-3 py-1.5 rounded-md bg-primary/10 text-primary border border-primary/30"
                              >
                                {t.label}
                                <span className="ml-1.5 text-xs opacity-70">×{t.count}</span>
                              </span>
                            ))
                          )}
                        </div>
                      </section>
                      <section className="glass-card rounded-xl p-5">
                        <h3 className="font-semibold mb-3">Risk Assessment</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {riskAssessment}
                        </p>
                      </section>
                    </div>

                    <section className="glass-card rounded-xl p-5">
                      <h3 className="font-semibold mb-3">Latest Developments</h3>
                      <ul className="space-y-3">
                        {countryArticles.slice(0, 10).map((a) => (
                          <li
                            key={a.id}
                            className="flex gap-4 p-3 rounded-md bg-background/40 border border-border/60"
                          >
                            <div className="text-xs text-muted-foreground w-24 shrink-0" suppressHydrationWarning>
                              {formatRelative(a.pubDate)}
                            </div>
                            <div className="flex-1 text-sm">
                              <a
                                href={a.link}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="hover:text-primary inline-flex items-start gap-1.5"
                              >
                                {a.title}
                                <ExternalLink className="size-3 mt-1 shrink-0 opacity-60" />
                              </a>
                              <div className="text-[11px] text-muted-foreground mt-0.5">
                                {a.source}
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </section>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
