import { useCallback, useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ArrowUpRight, Globe2, Sparkles } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { synthesizeExecutiveSummary, type ExecutiveBriefing } from "@/lib/briefing.functions";
import type { NewsItem } from "@/lib/news-service";

interface Props {
  articles: NewsItem[];
}

function SynthesizingIndicator() {
  const [dots, setDots] = useState("");

  useEffect(() => {
    const id = setInterval(() => {
      setDots((d) => (d.length >= 3 ? "" : d + "."));
    }, 400);
    return () => clearInterval(id);
  }, []);

  return (
    <span className="text-sm text-primary font-medium">
      Synthesizing Intelligence{dots}
    </span>
  );
}

function BriefingSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Synthesizing intelligence report">
      <div className="flex items-center gap-2 pb-1">
        <span className="relative flex size-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/60 opacity-75" />
          <span className="relative inline-flex rounded-full size-2 bg-primary" />
        </span>
        <SynthesizingIndicator />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-4/5" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3 w-36" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-11/12" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-3 w-40" />
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/4" />
      </div>
      <div className="space-y-2 pt-1">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-8 w-full rounded-md" />
        <Skeleton className="h-8 w-full rounded-md" />
      </div>
    </div>
  );
}

function BriefingContent({ briefing }: { briefing: ExecutiveBriefing }) {
  return (
    <div className="space-y-4 text-sm leading-relaxed text-foreground/90">
      <section>
        <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5">Global Overview</h3>
        <p>{briefing.globalOverview}</p>
      </section>
      <section>
        <h3 className="text-xs uppercase tracking-wider text-risk-high mb-1.5">Top Geopolitical Risk</h3>
        <p>{briefing.topGeopoliticalRisk}</p>
      </section>
      <section>
        <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5">Most Important Development</h3>
        <p>{briefing.mostImportantDevelopment}</p>
      </section>
      {briefing.countriesToWatch.length > 0 && (
        <section>
          <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
            <Globe2 className="size-3.5 text-primary" /> Countries To Watch
          </h3>
          <ul className="space-y-2">
            {briefing.countriesToWatch.map((c) => (
              <li key={c.country} className="rounded-md border border-border/50 bg-background/30 px-3 py-2">
                <div className="font-medium text-foreground">{c.country}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{c.reasoning}</div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

export function ExecutiveSummaryPanel({ articles }: Props) {
  const synthesize = useServerFn(synthesizeExecutiveSummary);
  const [briefing, setBriefing] = useState<ExecutiveBriefing | null>(null);
  const [synthesizing, setSynthesizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedAt, setGeneratedAt] = useState<string | null>(null);

  const handleSynthesize = useCallback(async () => {
    if (articles.length === 0 || synthesizing) return;

    setSynthesizing(true);
    setError(null);

    try {
      const res = await synthesize({
        data: {
          articles: articles.map(({ title, summary }) => ({ title, summary: summary ?? "" })),
        },
      });

      if (res.error || !res.result) {
        setError(res.error ?? "Failed to synthesize executive summary.");
        setBriefing(null);
      } else {
        setBriefing(res.result);
        setGeneratedAt(
          new Date().toLocaleString([], {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
            timeZoneName: "short",
          }),
        );
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to synthesize executive summary.");
      setBriefing(null);
    } finally {
      setSynthesizing(false);
    }
  }, [articles, synthesize, synthesizing]);

  const canSynthesize = articles.length > 0 && !synthesizing;

  return (
    <section className="glass-card rounded-xl p-5">
      <header className="flex items-center justify-between mb-4 gap-2">
        <h2 className="font-semibold flex items-center gap-2">
          <Sparkles className="size-4 text-primary" /> Executive Summary
        </h2>
        {generatedAt && !synthesizing && (
          <span className="text-[11px] text-muted-foreground shrink-0">{generatedAt}</span>
        )}
      </header>

      {error && (
        <div className="mb-3 text-xs px-3 py-2 rounded-md border border-destructive/40 bg-destructive/10 text-destructive">
          {error}
        </div>
      )}

      {synthesizing ? (
        <BriefingSkeleton />
      ) : briefing ? (
        <>
          <BriefingContent briefing={briefing} />
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={handleSynthesize}
              disabled={!canSynthesize}
              className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-md border border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              ⚡ Synthesize Global Overview
            </button>
            <button className="inline-flex items-center gap-1 text-xs text-primary hover:underline">
              Full briefing <ArrowUpRight className="size-3" />
            </button>
          </div>
        </>
      ) : (
        <div className="space-y-4">
          {articles.length === 0 ? (
            <p className="text-sm text-muted-foreground">Waiting for live intelligence feed…</p>
          ) : (
            <p className="text-sm text-muted-foreground">
              On-demand synthesis powered by Gemini 2.5 Flash. Trigger manually to conserve API quota.
            </p>
          )}
          <button
            type="button"
            onClick={handleSynthesize}
            disabled={!canSynthesize}
            className="inline-flex items-center gap-1.5 text-sm px-4 py-2 rounded-md border border-primary/40 bg-primary/10 text-primary hover:bg-primary/20 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
          >
            ⚡ Synthesize Global Overview
          </button>
        </div>
      )}
    </section>
  );
}
