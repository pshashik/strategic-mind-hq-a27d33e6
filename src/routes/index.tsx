import { createFileRoute } from "@tanstack/react-router";
import { AppLayout, riskColor } from "@/components/AppLayout";
import { breakingNews, topRisks, trendingCountries, strategicAlerts, executiveSummary } from "@/lib/mock-data";
import { AlertTriangle, TrendingUp, Sparkles, Activity, ArrowUpRight } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Dashboard — StrategicMind AI" }] }),
  component: Dashboard,
});

function Dashboard() {
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

          <section className="glass-card rounded-xl p-5">
            <header className="flex items-center justify-between mb-4">
              <h2 className="font-semibold flex items-center gap-2"><Sparkles className="size-4 text-primary" /> Executive Summary</h2>
            </header>
            <p className="text-sm leading-relaxed text-foreground/90">{executiveSummary.body}</p>
            <button className="mt-4 inline-flex items-center gap-1 text-xs text-primary hover:underline">
              Full briefing <ArrowUpRight className="size-3" />
            </button>
          </section>
        </div>

        <div className="grid lg:grid-cols-3 gap-4">
          <section className="glass-card rounded-xl p-5">
            <header className="flex items-center justify-between mb-4">
              <h2 className="font-semibold flex items-center gap-2"><AlertTriangle className="size-4 text-risk-high" /> Top Risks</h2>
            </header>
            <ul className="space-y-3">
              {topRisks.map((r) => (
                <li key={r.id}>
                  <div className="flex justify-between text-sm">
                    <span className="truncate">{r.title}</span>
                    <span className="text-muted-foreground text-xs">{r.probability}%</span>
                  </div>
                  <div className="mt-1.5 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-risk-medium to-risk-critical" style={{ width: `${r.probability}%` }} />
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-1">Impact: {r.impact}</div>
                </li>
              ))}
            </ul>
          </section>

          <section className="glass-card rounded-xl p-5">
            <header className="flex items-center justify-between mb-4">
              <h2 className="font-semibold flex items-center gap-2"><TrendingUp className="size-4 text-primary" /> Trending Countries</h2>
            </header>
            <ul className="space-y-2.5">
              {trendingCountries.map((c) => (
                <li key={c.code} className="flex items-center justify-between p-2 rounded-md hover:bg-accent/30">
                  <div className="flex items-center gap-3">
                    <div className="size-8 rounded-md bg-muted text-xs font-semibold flex items-center justify-center">{c.code}</div>
                    <div>
                      <div className="text-sm">{c.name}</div>
                      <div className={`text-[11px] inline-block px-1.5 py-0.5 rounded border ${riskColor(c.risk)}`}>{c.risk}</div>
                    </div>
                  </div>
                  <div className="text-sm font-medium text-risk-high">{c.change}</div>
                </li>
              ))}
            </ul>
          </section>

          <section className="glass-card rounded-xl p-5">
            <header className="flex items-center justify-between mb-4">
              <h2 className="font-semibold flex items-center gap-2"><AlertTriangle className="size-4 text-risk-critical" /> Strategic Alerts</h2>
            </header>
            <ul className="space-y-3">
              {strategicAlerts.map((a) => (
                <li key={a.id} className="flex gap-3 p-2 rounded-md bg-background/40">
                  <span className={`mt-1 size-2 rounded-full ${a.level === "critical" ? "bg-risk-critical" : a.level === "high" ? "bg-risk-high" : "bg-risk-medium"}`} />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm leading-snug">{a.title}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">{a.time} ago</div>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </AppLayout>
  );
}
