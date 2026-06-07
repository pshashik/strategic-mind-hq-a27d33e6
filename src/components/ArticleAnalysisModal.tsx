import { useEffect, useMemo, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useServerFn } from "@tanstack/react-start";
import { analyzeArticle, type ArticleAnalysis } from "@/lib/intelligence.functions";
import { classifyAIError, aiErrorMessage } from "@/lib/ai-errors";
import { generateLocalArticleAnalysis } from "@/lib/local-article-analysis";
import {
  AlertCircle,
  ExternalLink,
  Gauge,
  Globe2,
  Landmark,
  LineChart,
  Loader2,
  Shield,
  Sparkles,
  Swords,
  CalendarClock,
} from "lucide-react";
import type { NewsItem } from "@/lib/news-service";

interface Props {
  article: NewsItem | null;
  onOpenChange: (open: boolean) => void;
}

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const CACHE_PREFIX = "article-analysis:";

interface CacheEntry {
  cachedAt: number;
  result: ArticleAnalysis;
}

function cacheKey(article: NewsItem): string {
  return `${CACHE_PREFIX}${article.link || article.id}`;
}

function readCache(article: NewsItem): ArticleAnalysis | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(cacheKey(article));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CacheEntry;
    if (!parsed?.cachedAt || !parsed.result) return null;
    if (Date.now() - parsed.cachedAt > CACHE_TTL_MS) return null;
    return parsed.result;
  } catch {
    return null;
  }
}

function writeCache(article: NewsItem, result: ArticleAnalysis): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(
      cacheKey(article),
      JSON.stringify({ cachedAt: Date.now(), result } satisfies CacheEntry),
    );
  } catch {
    // ignore
  }
}

function formatPubDate(ts?: number): string {
  if (!ts) return "Unknown date";
  const d = new Date(ts);
  if (Number.isNaN(d.getTime())) return "Unknown date";
  return d.toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

export function ArticleAnalysisModal({ article, onOpenChange }: Props) {
  const [result, setResult] = useState<ArticleAnalysis | null>(null);
  const [cachedAt, setCachedAt] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [usedFallback, setUsedFallback] = useState(false);
  const analyze = useServerFn(analyzeArticle);

  // Reset state when article changes; prefill from cache if present (no API call).
  useEffect(() => {
    setResult(null);
    setCachedAt(null);
    setError(null);
    setLoading(false);
    setUsedFallback(false);
    if (!article) return;
    const cached = readCache(article);
    if (cached) {
      setResult(cached);
      try {
        const raw = localStorage.getItem(cacheKey(article));
        if (raw) {
          const parsed = JSON.parse(raw) as CacheEntry;
          if (parsed.cachedAt) setCachedAt(parsed.cachedAt);
        }
      } catch {
        // ignore
      }
    }
  }, [article]);

  const pubDateLabel = useMemo(() => formatPubDate(article?.pubDate), [article]);

  async function runAnalysis(force = false) {
    if (!article) return;
    if (!force) {
      const cached = readCache(article);
      if (cached) {
        setResult(cached);
        setUsedFallback(false);
        setError(null);
        return;
      }
    }
    setLoading(true);
    setError(null);
    setUsedFallback(false);
    try {
      const res = await analyze({
        data: { title: article.title, summary: article.summary ?? "" },
      });
      if (res.error || !res.result) {
        const code = res.errorCode ?? classifyAIError(res.error);
        console.error("[analyzeArticle] failure", code, res.error);
        // Fallback: local analysis so the user is never left with a blank state.
        const fallback = generateLocalArticleAnalysis(article);
        setResult(fallback);
        setUsedFallback(true);
        setError(aiErrorMessage(code));
        setCachedAt(null);
      } else {
        setResult(res.result);
        setCachedAt(Date.now());
        setUsedFallback(false);
        writeCache(article, res.result);
      }
    } catch (e) {
      const code = classifyAIError(e);
      console.error("[analyzeArticle] threw", e);
      const fallback = generateLocalArticleAnalysis(article);
      setResult(fallback);
      setUsedFallback(true);
      setError(aiErrorMessage(code));
      setCachedAt(null);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={!!article} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card max-w-3xl max-h-[90vh] overflow-y-auto border-border/60">
        {article && (
          <>
            <DialogHeader>
              <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider text-primary">
                <Sparkles className="size-3.5" /> Intelligence Report
              </div>
              <DialogTitle className="text-lg leading-snug pr-6">{article.title}</DialogTitle>
              <DialogDescription asChild>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                  <span className="inline-flex items-center gap-1 text-foreground/80">
                    <span className="font-medium">{article.source}</span>
                  </span>
                  <span className="inline-flex items-center gap-1 text-muted-foreground">
                    <CalendarClock className="size-3" /> {pubDateLabel}
                  </span>
                  <a
                    href={article.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-primary hover:underline"
                  >
                    Open article <ExternalLink className="size-3" />
                  </a>
                </div>
              </DialogDescription>
            </DialogHeader>

            {article.summary && (
              <section className="rounded-lg border border-border/60 bg-background/40 p-4">
                <h3 className="text-xs uppercase tracking-wider text-muted-foreground mb-2">
                  Article Summary
                </h3>
                <p className="text-sm leading-relaxed text-foreground/90">{article.summary}</p>
              </section>
            )}

            {!result && !loading && (
              <div className="flex flex-col items-center gap-2 py-2">
                <button
                  onClick={() => runAnalysis(false)}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-md bg-gradient-to-r from-primary to-primary/70 text-primary-foreground text-sm font-medium shadow-sm hover:opacity-90 transition"
                >
                  <Sparkles className="size-4" /> Analyze Intelligence Report
                </button>
                <p className="text-[11px] text-muted-foreground">
                  Results are cached for 24 hours.
                </p>
              </div>
            )}

            {loading && (
              <>
                <div className="flex items-center justify-center gap-2 py-2 text-sm text-muted-foreground">
                  <Loader2 className="size-4 animate-spin text-primary" />
                  Generating intelligence report…
                </div>
                <LoadingState />
              </>
            )}

            {error && !loading && (
              <div
                className={`flex items-start gap-2 p-3 rounded-md border text-sm ${
                  usedFallback
                    ? "border-risk-medium/40 bg-risk-medium/10 text-risk-medium"
                    : "border-destructive/40 bg-destructive/10 text-destructive"
                }`}
              >
                <AlertCircle className="size-4 mt-0.5 shrink-0" />
                <span>
                  {error}
                  {usedFallback && " Showing a local intelligence estimate instead."}
                </span>
              </div>
            )}

            {result && !loading && (
              <>
                <Report result={result} />
                <div className="flex items-center justify-between gap-2 pt-1">
                  <span className="text-[11px] text-muted-foreground">
                    {usedFallback
                      ? "Local intelligence estimate"
                      : cachedAt
                        ? `Cached ${formatPubDate(cachedAt)}`
                        : ""}
                  </span>
                  <button
                    onClick={() => runAnalysis(true)}
                    className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md border border-border/60 hover:bg-accent/40"
                  >
                    <Sparkles className="size-3.5" /> {usedFallback ? "Retry analysis" : "Re-run analysis"}
                  </button>
                </div>
              </>
            )}
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
      <p className="text-sm leading-relaxed text-foreground/90">
        {body || "No assessment provided."}
      </p>
    </div>
  );
}
