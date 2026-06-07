import { createFileRoute } from "@tanstack/react-router";
import { AppLayout } from "@/components/AppLayout";
import { useArticles } from "@/hooks/use-articles";
import { useMemo, useState } from "react";
import { Globe2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  computeGlobalRiskMap,
  riskBandBadgeClass,
  riskBandBarClass,
  riskBandDotClass,
  riskBandLabel,
  type MapCountryRisk,
  type RiskMapBand,
} from "@/lib/risk-map";

export const Route = createFileRoute("/risk-map")({
  head: () => ({ meta: [{ title: "Global Risk Map — StrategicMind AI" }] }),
  component: RiskMap,
});

const LEGEND: { band: RiskMapBand; range: string }[] = [
  { band: "low", range: "0–3" },
  { band: "medium", range: "4–6" },
  { band: "high", range: "7–10" },
];

function RiskMap() {
  const { articles, loading } = useArticles();
  const countries = useMemo(
    () =>
      computeGlobalRiskMap(
        articles.map(({ title, summary, pubDate }) => ({
          title,
          summary: summary ?? "",
          pubDate,
        })),
      ),
    [articles],
  );

  const [selected, setSelected] = useState<MapCountryRisk | null>(null);
  const active = selected ?? countries.find((c) => c.riskScore > 0) ?? countries[0];

  return (
    <AppLayout>
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight flex items-center gap-2">
            <Globe2 className="size-6 text-primary" /> Global Risk Map
          </h1>
          <p className="text-sm text-muted-foreground">
            Live keyword-derived risk scores (0–10) from the intelligence feed.
          </p>
        </div>

        {loading && articles.length === 0 ? (
          <div className="glass-card rounded-xl p-8 space-y-3">
            <Skeleton className="h-64 w-full rounded-lg" />
            <Skeleton className="h-4 w-48" />
          </div>
        ) : (
          <div className="grid lg:grid-cols-[1fr_320px] gap-4">
            <div className="glass-card rounded-xl p-4 relative overflow-hidden">
              <svg viewBox="0 0 100 70" className="w-full h-auto bg-background/30 rounded-lg">
                <g fill="oklch(0.26 0.025 250)" stroke="oklch(0.32 0.03 250)" strokeWidth="0.15">
                  <path d="M8,18 Q14,12 22,15 L30,18 L32,28 L28,38 L20,44 L12,40 L8,30 Z" />
                  <path d="M26,50 L34,48 L36,58 L32,68 L28,68 L24,60 Z" />
                  <path d="M44,20 L54,18 L56,28 L50,32 L44,30 Z" />
                  <path d="M46,38 L58,36 L60,50 L54,64 L48,62 L44,50 Z" />
                  <path d="M56,16 L84,14 L88,28 L84,40 L74,46 L62,42 L56,32 Z" />
                  <path d="M78,56 L88,54 L90,62 L82,64 Z" />
                </g>

                {countries.map((c) => (
                  <g key={c.code} onClick={() => setSelected(c)} className="cursor-pointer">
                    <circle
                      cx={c.x}
                      cy={c.y}
                      r="2.4"
                      className={`${riskBandDotClass(c.band)} opacity-30 animate-pulse`}
                    />
                    <circle cx={c.x} cy={c.y} r="1.2" className={riskBandDotClass(c.band)} />
                    {active.code === c.code && (
                      <circle
                        cx={c.x}
                        cy={c.y}
                        r="3"
                        fill="none"
                        stroke="oklch(0.92 0.01 250)"
                        strokeWidth="0.3"
                      />
                    )}
                  </g>
                ))}
              </svg>
              <div className="mt-4 flex flex-wrap gap-3 text-xs">
                {LEGEND.map(({ band, range }) => (
                  <span
                    key={band}
                    className={`px-2 py-1 rounded border ${riskBandBadgeClass(band)}`}
                  >
                    <span
                      className={`inline-block size-2 rounded-full mr-1.5 ${riskBandDotClass(band).replace("fill-", "bg-")}`}
                    />
                    {riskBandLabel(band)} ({range})
                  </span>
                ))}
              </div>
            </div>

            <aside className="glass-card rounded-xl p-5 space-y-4">
              <div>
                <div className="text-xs text-muted-foreground">Selected</div>
                <div className="text-xl font-semibold">{active.name}</div>
                <div className="text-xs text-muted-foreground">{active.region}</div>
              </div>
              <div>
                <div className="flex justify-between text-xs">
                  <span>Risk Score</span>
                  <span>{active.riskScore}/10</span>
                </div>
                <div className="mt-1 h-2 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${riskBandBarClass(active.band)}`}
                    style={{ width: `${(active.riskScore / 10) * 100}%` }}
                  />
                </div>
              </div>
              <span
                className={`inline-block text-xs px-2 py-1 rounded border ${riskBandBadgeClass(active.band)}`}
              >
                {riskBandLabel(active.band).toUpperCase()} · {active.riskScore}/10
              </span>
              <div>
                <div className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                  Feed Mentions
                </div>
                {active.developments.length > 0 ? (
                  <ul className="space-y-2">
                    {active.developments.map((d, i) => (
                      <li key={i} className="text-sm border-l-2 border-primary/40 pl-3">
                        <div className="text-[11px] text-muted-foreground">{d.date}</div>
                        {d.headline}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No matching feed articles for this country.
                  </p>
                )}
              </div>
            </aside>
          </div>
        )}

        <div className="glass-card rounded-xl p-5">
          <h2 className="font-semibold mb-3">Country Risk Index</h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {[...countries]
              .sort((a, b) => b.riskScore - a.riskScore)
              .map((c) => (
                <button
                  key={c.code}
                  onClick={() => setSelected(c)}
                  className="text-left p-3 rounded-md border border-border/60 hover:border-primary/40 hover:bg-accent/20 flex items-center gap-3"
                >
                  <div
                    className={`size-10 rounded-md flex items-center justify-center text-xs font-semibold ${riskBandDotClass(c.band).replace("fill-", "bg-")}/15`}
                  >
                    {c.code}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm truncate">{c.name}</div>
                    <div className="text-[11px] text-muted-foreground">{c.region}</div>
                  </div>
                  <div
                    className={`text-sm font-semibold ${riskBandBadgeClass(c.band).split(" ")[0]}`}
                  >
                    {c.riskScore}
                  </div>
                </button>
              ))}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
