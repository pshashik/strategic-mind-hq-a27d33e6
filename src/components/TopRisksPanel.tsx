import { useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AlertTriangle } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { riskColor } from "@/components/AppLayout";
import { synthesizeTopRisks, type GeopoliticalRisk } from "@/lib/risks.functions";
import { computeLocalTopRisks, isRateLimitError, type NewsItem } from "@/lib/news-service";

interface Props {
  articles: NewsItem[];
}

type SeverityTier = "critical" | "high" | "medium" | "low";

function severityTier(score: number): SeverityTier {
  if (score >= 90) return "critical";
  if (score >= 70) return "high";
  if (score >= 40) return "medium";
  return "low";
}

function severityBarClass(score: number): string {
  const tier = severityTier(score);
  return {
    critical: "bg-risk-critical",
    high: "bg-risk-high",
    medium: "bg-risk-medium",
    low: "bg-risk-low",
  }[tier];
}

function severityLabel(score: number): string {
  return severityTier(score).toUpperCase();
}

function RecalibratingIndicator() {
  const [dots, setDots] = useState("");

  useEffect(() => {
    const id = setInterval(() => {
      setDots((d) => (d.length >= 3 ? "" : d + "."));
    }, 400);
    return () => clearInterval(id);
  }, []);

  return (
    <span className="text-sm text-primary font-medium">
      Recalibrating Threat Matrix{dots}
    </span>
  );
}

function RisksSkeleton() {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Recalibrating threat matrix">
      <div className="flex items-center gap-2 pb-1">
        <span className="relative flex size-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary/60 opacity-75" />
          <span className="relative inline-flex rounded-full size-2 bg-primary" />
        </span>
        <RecalibratingIndicator />
      </div>
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="flex justify-between">
            <Skeleton className="h-3.5 w-3/5" />
            <Skeleton className="h-3.5 w-8" />
          </div>
          <Skeleton className="h-1.5 w-full rounded-full" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      ))}
    </div>
  );
}

function RiskItem({ risk, localFallback }: { risk: GeopoliticalRisk; localFallback?: boolean }) {
  const tier = severityTier(risk.severityScore);
  return (
    <li>
      <div className="flex justify-between text-sm gap-2">
        <span className="truncate">{risk.riskName}</span>
        <span className="text-muted-foreground text-xs shrink-0">{risk.severityScore}%</span>
      </div>
      <div className="mt-1.5 h-1.5 rounded-full bg-muted overflow-hidden">
        <div
          className={`h-full transition-all duration-500 ${severityBarClass(risk.severityScore)}`}
          style={{ width: `${risk.severityScore}%` }}
        />
      </div>
      <div className="mt-1 flex items-center gap-2 text-[11px]">
        <span className={`px-1.5 py-0.5 rounded border ${riskColor(tier)}`}>
          {severityLabel(risk.severityScore)}
        </span>
        <span className="text-muted-foreground">{risk.regionAffected}</span>
        {localFallback && (
          <span className="text-muted-foreground italic">· local estimate</span>
        )}
      </div>
    </li>
  );
}

export function TopRisksPanel({ articles }: Props) {
  const synthesize = useServerFn(synthesizeTopRisks);
  const [risks, setRisks] = useState<GeopoliticalRisk[] | null>(null);
  const [synthesizing, setSynthesizing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usedLocalFallback, setUsedLocalFallback] = useState(false);
  const feedKeyRef = useRef("");

  useEffect(() => {
    if (articles.length === 0) return;

    const feedKey = articles.map((a) => a.id).join("|");
    feedKeyRef.current = feedKey;

    let cancelled = false;
    setSynthesizing(true);
    setError(null);
    setUsedLocalFallback(false);

    synthesize({
      data: {
        articles: articles.map(({ title, summary }) => ({ title, summary: summary ?? "" })),
      },
    })
      .then((res) => {
        if (cancelled || feedKeyRef.current !== feedKey) return;

        if (res.result) {
          setRisks(res.result);
          return;
        }

        if (res.rateLimited || isRateLimitError(res.error)) {
          setRisks(computeLocalTopRisks(articles));
          setUsedLocalFallback(true);
          setError("API quota reached — showing keyword-based local threat estimate.");
          return;
        }

        setError(res.error ?? "Failed to synthesize top risks.");
        setRisks(null);
      })
      .catch((e) => {
        if (cancelled || feedKeyRef.current !== feedKey) return;
        const msg = e instanceof Error ? e.message : "Failed to synthesize top risks.";
        if (isRateLimitError(msg)) {
          setRisks(computeLocalTopRisks(articles));
          setUsedLocalFallback(true);
          setError("API quota reached — showing keyword-based local threat estimate.");
        } else {
          setError(msg);
          setRisks(null);
        }
      })
      .finally(() => {
        if (!cancelled && feedKeyRef.current === feedKey) setSynthesizing(false);
      });

    return () => {
      cancelled = true;
    };
  }, [articles, synthesize]);

  return (
    <section className="glass-card rounded-xl p-5">
      <header className="flex items-center justify-between mb-4">
        <h2 className="font-semibold flex items-center gap-2">
          <AlertTriangle className="size-4 text-risk-high" /> Top Risks
        </h2>
      </header>

      {error && (
        <div
          className={`mb-3 text-xs px-3 py-2 rounded-md border ${
            usedLocalFallback
              ? "border-risk-medium/40 bg-risk-medium/10 text-risk-medium"
              : "border-destructive/40 bg-destructive/10 text-destructive"
          }`}
        >
          {error}
        </div>
      )}

      {synthesizing ? (
        <RisksSkeleton />
      ) : risks && risks.length > 0 ? (
        <ul className="space-y-3">
          {risks.map((r) => (
            <RiskItem
              key={`${r.riskName}-${r.regionAffected}`}
              risk={r}
              localFallback={usedLocalFallback}
            />
          ))}
        </ul>
      ) : articles.length === 0 ? (
        <p className="text-sm text-muted-foreground">Waiting for live intelligence feed…</p>
      ) : null}
    </section>
  );
}
