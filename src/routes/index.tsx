import { createFileRoute } from "@tanstack/react-router";
import { AppLayout, riskColor } from "@/components/AppLayout";
import { breakingNews, executiveSummary } from "@/lib/mock-data";
import { AlertTriangle, Activity } from "lucide-react";
import { LatestIntelligenceFeed } from "@/components/LatestIntelligenceFeed";
import { ExecutiveSummaryPanel } from "@/components/ExecutiveSummaryPanel";
import { TopRisksPanel } from "@/components/TopRisksPanel";
import { StrategicAlertsPanel } from "@/components/StrategicAlertsPanel";
import { TrendingCountriesPanel } from "@/components/TrendingCountriesPanel";
import { useArticles } from "@/hooks/use-articles";
export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Dashboard — StrategicMind AI" }] }),
  component: Dashboard,
});

function Dashboard() {
  const { articles, loading, refreshing, error, reload } = useArticles();

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-end justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Strategic Dashboard</h1>
            <p className="text-sm text-muted-foreground">Transforming global news into strategic intelligence.</p>
          </div>
          <div className="text-xs text-muted-foreground">Last sync: {executiveSummary.generated}</div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {executiveSummary.metrics.map((m) => (
            <div key={m.label} className="glass-card rounded-lg p-4">
              <div className="text-xs uppercase tracking-wider text-muted-foreground">{m.label}</div>
              <div className="mt-1 text-2xl font-semibold text-gradient">{m.value}</div>
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          <section className="lg:col-span-2 glass-card rounded-xl p-5">
            <header className="flex items-center justify-between mb-4">
              <h2 className="font-semibold flex items-center gap-2"><Activity className="size-4 text-primary" /> Breaking Geopolitical News</h2>
              <span className="text-xs text-muted-foreground">Live feed</span>
            </header>
            <ul className="divide-y divide-border/60">
              {breakingNews.map((n) => (
                <li key={n.id} className="py-3 flex gap-4">
                  <div className={`shrink-0 mt-1 size-2 rounded-full ${
                    n.severity === "critical" ? "bg-risk-critical" : n.severity === "high" ? "bg-risk-high" : n.severity === "medium" ? "bg-risk-medium" : "bg-risk-low"
                  } ring-4 ring-current/10`} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-sm font-medium truncate">{n.title}</h3>
                      <span className="text-[11px] text-muted-foreground shrink-0">{n.time}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{n.summary}</p>
                    <div className="mt-2 flex items-center gap-2 text-[11px]">
                      <span className={`px-2 py-0.5 rounded border ${riskColor(n.severity)}`}>{n.severity.toUpperCase()}</span>
                      <span className="text-muted-foreground">{n.region}</span>
                      <span className="text-muted-foreground">·</span>
                      <span className="text-muted-foreground">{n.source}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
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
