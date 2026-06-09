import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppLayout, riskColor } from "@/components/AppLayout";
import { AlertTriangle, Activity } from "lucide-react";
import { LatestIntelligenceFeed } from "@/components/LatestIntelligenceFeed";
import { ExecutiveSummaryPanel } from "@/components/ExecutiveSummaryPanel";
import { TopRisksPanel } from "@/components/TopRisksPanel";
import { StrategicAlertsPanel } from "@/components/StrategicAlertsPanel";
import { TrendingCountriesPanel } from "@/components/TrendingCountriesPanel";
import { useArticles } from "@/hooks/use-articles";
import { formatRelative, type NewsItem } from "@/lib/news-service";
import { generateLocalAlerts } from "@/lib/alerts.functions";
import { buildExecutiveSummaryMetrics } from "@/lib/simple-briefing";
import type { RiskLevel } from "@/lib/mock-data";
import { deriveArticleSeverity } from "@/lib/risk-engine";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Dashboard — StrategicMind AI" }] }),
  component: Dashboard,
});

const CONFLICT_RX =
  /\b(war|conflict|invasion|airstrike|missile|drone|attack|bombard|clash|shelling|insurgent|coup|skirmish|battle|troops?)\b/i;

// function deriveSeverity(article: NewsItem): RiskLevel {
//   const text = `${article.title} ${article.summary ?? ""}`;
//   if (/\b(war|invasion|missile|airstrike|nuclear|massacre|atrocity|kill(?:ed|s)?)\b/i.test(text))
//     return "critical";
//   if (CONFLICT_RX.test(text) || /\bsanctions?|blockade|embargo\b/i.test(text)) return "high";
//   if (/\b(protest|tension|negotiat|summit|talks|ceasefire|sanction|tariff)\b/i.test(text))
//     return "medium";
//   return "low";
// }

function deriveSeverity(article: NewsItem): RiskLevel {
  return deriveArticleSeverity(article.title, article.summary);
}

const SEVERITY_RANK: Record<RiskLevel, number> = { critical: 4, high: 3, medium: 2, low: 1 };

interface BreakingItem {
  id: string;
  title: string;
  source: string;
  region: string;
  severity: RiskLevel;
  summary: string;
  time: string;
}

function buildBreakingNews(articles: NewsItem[]): BreakingItem[] {
  return articles
    .map((a) => {
      const severity = deriveSeverity(a);
      const metrics = buildExecutiveSummaryMetrics([
        { title: a.title, description: a.summary ?? "" },
      ]);
      return {
        id: a.id,
        title: a.title,
        source: a.source,
        region: metrics.highestRiskRegion,
        severity,
        summary: a.summary ?? "",
        time: formatRelative(a.pubDate),
        _rank: SEVERITY_RANK[severity],
        _ts: a.pubDate,
      };
    })
    .sort((a, b) => b._rank - a._rank || b._ts - a._ts)
    .slice(0, 6)
    .map(({ _rank, _ts, ...rest }) => {
      void _rank;
      void _ts;
      return rest;
    });
}

interface DashboardMetric {
  label: string;
  value: string;
}

function buildMetrics(articles: NewsItem[]): DashboardMetric[] {
  if (articles.length === 0) {
    return [
      { label: "Active Conflicts", value: "—" },
      { label: "Priority Alerts", value: "—" },
      { label: "Countries Monitored", value: "—" },
      { label: "Sources Today", value: "—" },
    ];
  }
  // const activeConflicts = articles.filter((a) =>
  //   CONFLICT_RX.test(`${a.title} ${a.summary ?? ""}`),
  // ).length;

  const activeConflicts = articles.filter((a) => {
    const sev = deriveSeverity(a);

    return sev === "critical" || sev === "high";
  }).length;

  const alerts = generateLocalAlerts(
    articles.map((a) => ({
      id: a.id,
      title: a.title,
      summary: a.summary,
      pubDate: a.pubDate,
    })),
  );
  const criticalAlerts = alerts.filter(
    (al) => al.severity === "Critical" || al.severity === "High",
  ).length;

  const countries = new Set<string>();
  for (const a of articles) {
    const m = buildExecutiveSummaryMetrics([{ title: a.title, description: a.summary ?? "" }]);
    if (m.mostMentionedCountry && m.mostMentionedCountry !== "Multiple countries") {
      countries.add(m.mostMentionedCountry);
    }
  }

  const sources = new Set(articles.map((a) => a.source));

  return [
    { label: "Active Conflicts", value: String(activeConflicts) },
    { label: "Critical Alerts", value: String(criticalAlerts) },
    { label: "Countries Monitored", value: String(Math.max(countries.size, 1)) },
    { label: "Sources Today", value: String(sources.size) },
  ];
}

function formatLastSyncIST(date: Date): string {
  // "DD MMM YYYY, HH:mm:ss IST" in Asia/Kolkata
  const opts: Intl.DateTimeFormatOptions = {
    timeZone: "Asia/Kolkata",
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  };
  const parts = new Intl.DateTimeFormat("en-GB", opts).formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("day")} ${get("month")} ${get("year")}, ${get("hour")}:${get("minute")}:${get("second")} IST`;
}

function Dashboard() {
  const { articles, loading, refreshing, error, reload } = useArticles();

  //const [now, setNow] = useState<Date>(() => new Date());
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => {
    setNow(new Date());

    const id = setInterval(() => {
      setNow(new Date());
    }, 60000);

    return () => clearInterval(id);
  }, []);

  const breaking = useMemo(() => buildBreakingNews(articles), [articles]);
  const metrics = useMemo(() => buildMetrics(articles), [articles]);
  //const lastSync = useMemo(() => formatLastSyncIST(now), [now]);
  const lastSync = now ? formatLastSyncIST(now) : "--";

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-end justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Strategic Dashboard</h1>
            <p className="text-sm text-muted-foreground">
              Transforming global news into strategic intelligence.
            </p>
          </div>
          <div className="text-xs text-muted-foreground" aria-live="polite">
            Last Sync: {lastSync}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {metrics.map((m) => (
            <div key={m.label} className="glass-card rounded-lg p-4">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">
                {m.label}
              </div>
              <div className="mt-1 text-2xl font-semibold text-gradient">{m.value}</div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          <section className="lg:col-span-2 glass-card rounded-xl p-5">
            <header className="flex items-center justify-between mb-4">
              <h2 className="font-semibold flex items-center gap-2">
                <Activity className="size-4 text-primary" /> Breaking Geopolitical News
              </h2>
              <span className="text-xs text-muted-foreground">Live feed</span>
            </header>
            {breaking.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-6">
                <AlertTriangle className="size-4" />
                {loading
                  ? "Loading live intelligence feed…"
                  : "No breaking developments detected in the latest feed."}
              </div>
            ) : (
              <ul className="divide-y divide-border/60">
                {breaking.map((n) => (
                  <li key={n.id} className="py-3 flex gap-4">
                    <div
                      className={`shrink-0 mt-1 size-2 rounded-full ${
                        n.severity === "critical"
                          ? "bg-risk-critical"
                          : n.severity === "high"
                            ? "bg-risk-high"
                            : n.severity === "medium"
                              ? "bg-risk-medium"
                              : "bg-risk-low"
                      } ring-4 ring-current/10`}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-sm font-medium truncate">{n.title}</h3>
                        <span className="text-[11px] text-muted-foreground shrink-0">{n.time}</span>
                      </div>
                      {n.summary && (
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                          {n.summary}
                        </p>
                      )}
                      <div className="mt-2 flex items-center gap-2 text-[11px]">
                        <span className={`px-2 py-0.5 rounded border ${riskColor(n.severity)}`}>
                          {n.severity.toUpperCase()}
                        </span>
                        <span className="text-muted-foreground">{n.region}</span>
                        <span className="text-muted-foreground">·</span>
                        <span className="text-muted-foreground">{n.source}</span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <ExecutiveSummaryPanel articles={articles} />
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          <TopRisksPanel articles={articles} />

          <TrendingCountriesPanel articles={articles} />
          <StrategicAlertsPanel articles={articles} />
        </div>

        <LatestIntelligenceFeed
          articles={articles}
          loading={loading}
          refreshing={refreshing}
          error={error}
          onRefresh={reload}
        />
      </div>
    </AppLayout>
  );
}
