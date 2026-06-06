import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useServerFn } from "@tanstack/react-start";
import { analyzeArticle, type ArticleAnalysis } from "@/lib/gemini.functions";
import {
  AlertCircle,
  ExternalLink,
  Gauge,
  Globe2,
  Landmark,
  LineChart,
  Shield,
  Sparkles,
  Swords,
} from "lucide-react";
import type { NewsItem } from "@/lib/news-service";

interface Props {
  article: NewsItem | null;
  onOpenChange: (open: boolean) => void;
}

export function ArticleAnalysisModal({ article, onOpenChange }: Props) {
  const [result, setResult] = useState<ArticleAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const analyze = useServerFn(analyzeArticle);

  useEffect(() => {
    if (!article) return;
    let cancelled = false;
    setResult(null);
    setError(null);
    setLoading(true);
    analyze({ data: { title: article.title, summary: article.summary ?? "" } })
      .then((res) => {
        if (cancelled) return;
        if (res.error || !res.result) setError(res.error ?? "Failed to analyze article.");
        else setResult(res.result);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e instanceof Error ? e.message : "Failed to analyze article.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [article, analyze]);

  return (
    <Dialog open={!!article} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card max-w-3xl max-h-[90vh] overflow-y-auto border-border/60">
        {article && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-primary">
                <Sparkles className="size-3.5" /> Intelligence Analysis
              </div>
              <DialogTitle className="text-lg leading-snug pr-6">{article.title}</DialogTitle>
              <DialogDescription className="flex items-center gap-2">
                <span>{article.source}</span>
                <a
                  href={article.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-primary hover:underline"
                >
                  Open article <ExternalLink className="size-3" />
                </a>
              </DialogDescription>
            </DialogHeader>

            {loading && <LoadingState />}

            {error && !loading && (
              <div className="flex items-start gap-2 p-3 rounded-md border border-destructive/40 bg-destructive/10 text-sm text-destructive">
                <AlertCircle className="size-4 mt-0.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {result && !loading && <Report result={result} />}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function LoadingState() {
  return (
    <div className="space-y-4 mt-2">
      <Skeleton className="h-20 w-full" />
      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-20" />
        <Skeleton className="h-20" />
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
    </div>
  );
}

function Report({ result }: { result: ArticleAnalysis }) {
  return (
    <div className="space-y-4 mt-2">
      <section className="rounded-lg border border-border/60 bg-background/40 p-4">
        <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
          <Sparkles className="size-3.5 text-primary" /> Executive Summary
        </h3>
        <p className="text-sm leading-relaxed text-foreground/90">{result.executiveSummary}</p>
      </section>

      <section className="rounded-lg border border-border/60 bg-background/40 p-4">
        <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-2 flex items-center gap-1.5">
          <Globe2 className="size-3.5 text-primary" /> Countries Involved
        </h3>
        {result.countriesInvolved.length ? (
          <div className="flex flex-wrap gap-1.5">
            {result.countriesInvolved.map((c) => (
              <span
                key={c}
                className="text-[11px] px-2 py-0.5 rounded-md border border-primary/30 bg-primary/10 text-primary"
              >
                {c}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">None identified.</p>
        )}
      </section>

      <div className="grid sm:grid-cols-2 gap-3">
        <ScoreCard
          label="Strategic Importance"
          score={result.strategicImportance}
          icon={<Gauge className="size-3.5" />}
          tone="primary"
        />
        <ScoreCard
          label="Risk Score"
          score={result.riskScore}
          icon={<Shield className="size-3.5" />}
          tone="risk"
        />
      </div>

      <div className="grid sm:grid-cols-2 gap-3">
        <ImpactBlock
          title="Political Impact"
          body={result.politicalImpact}
          icon={<Landmark className="size-3.5" />}
          accent="border-l-primary"
        />
        <ImpactBlock
          title="Economic Impact"
          body={result.economicImpact}
          icon={<LineChart className="size-3.5" />}
          accent="border-l-risk-medium"
        />
        <ImpactBlock
          title="Military Impact"
          body={result.militaryImpact}
          icon={<Swords className="size-3.5" />}
          accent="border-l-risk-critical"
        />
        <ImpactBlock
          title="Diplomatic Impact"
          body={result.diplomaticImpact}
          icon={<Globe2 className="size-3.5" />}
          accent="border-l-risk-low"
        />
      </div>
    </div>
  );
}

function ScoreCard({
  label,
  score,
  icon,
  tone,
}: {
  label: string;
  score: number;
  icon: React.ReactNode;
  tone: "primary" | "risk";
}) {
  const pct = (score / 10) * 100;
  const barClass =
    tone === "risk"
      ? score >= 8
        ? "bg-risk-critical"
        : score >= 6
        ? "bg-risk-high"
        : score >= 4
        ? "bg-risk-medium"
        : "bg-risk-low"
      : "bg-gradient-to-r from-primary to-primary/60";

  return (
    <div className="rounded-lg border border-border/60 bg-background/40 p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          {icon} {label}
        </div>
        <div className="text-lg font-semibold tabular-nums">
          {score}
          <span className="text-xs text-muted-foreground">/10</span>
        </div>
      </div>
      <div className="h-1.5 rounded-full bg-muted overflow-hidden">
        <div className={`h-full ${barClass}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function ImpactBlock({
  title,
  body,
  icon,
  accent,
}: {
  title: string;
  body: string;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <div className={`rounded-lg border border-border/60 bg-background/40 p-4 border-l-4 ${accent}`}>
      <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-1.5 flex items-center gap-1.5">
        {icon} {title}
      </h4>
      <p className="text-sm leading-relaxed text-foreground/90">{body || "No assessment provided."}</p>
    </div>
  );
}
