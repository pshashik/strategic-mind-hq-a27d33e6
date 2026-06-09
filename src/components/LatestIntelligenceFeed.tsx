import { useState } from "react";
import { Newspaper, RefreshCw, ExternalLink, Sparkles } from "lucide-react";
import { formatRelative, type NewsItem } from "@/lib/news-service";
import { Skeleton } from "@/components/ui/skeleton";
import { ArticleAnalysisModal } from "@/components/ArticleAnalysisModal";

interface Props {
  articles: NewsItem[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  onRefresh: () => void;
}

export function LatestIntelligenceFeed({ articles, loading, refreshing, error, onRefresh }: Props) {
  const [selected, setSelected] = useState<NewsItem | null>(null);

  return (
    <section className="glass-card rounded-xl p-5">
      <header className="flex items-center justify-between mb-4 gap-3">
        <h2 className="font-semibold flex items-center gap-2">
          <Newspaper className="size-4 text-primary" /> Latest Intelligence Feed
        </h2>
        <button
          onClick={onRefresh}
          disabled={refreshing || loading}
          className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-md border border-border/60 hover:bg-accent/40 disabled:opacity-60"
        >
          <RefreshCw className={`size-3.5 ${refreshing ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </header>

      {error && (
        <div className="mb-3 text-xs px-3 py-2 rounded-md border border-destructive/40 bg-destructive/10 text-destructive">
          {error}
        </div>
      )}

      {loading ? (
        <ul className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <li key={i} className="p-3 rounded-md border border-border/50 bg-background/30">
              <Skeleton className="h-3 w-20 mb-2" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-3 w-3/4" />
            </li>
          ))}
        </ul>
      ) : (
        <ul className="space-y-2.5 max-h-160 overflow-y-auto pr-1">
          {articles.map((n) => {
            const isBBC = n.source === "BBC News";
            return (
              <li
                key={n.id}
                onClick={() => setSelected(n)}
                className="group p-3 rounded-md border border-border/50 bg-background/40 hover:bg-accent/30 hover:border-primary/40 transition-colors cursor-pointer"
              >
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span
                    className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded border ${
                      isBBC
                        ? "text-risk-critical bg-risk-critical/10 border-risk-critical/30"
                        : "text-primary bg-primary/10 border-primary/30"
                    }`}
                  >
                    {n.source}
                  </span>
                  <span className="text-[11px] text-muted-foreground" suppressHydrationWarning>
                    {formatRelative(n.pubDate)}
                  </span>
                </div>
                <h3 className="text-sm font-medium leading-snug group-hover:text-primary">
                  {n.title}
                </h3>
                {n.summary && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{n.summary}</p>
                )}
                <div className="mt-2 flex items-center justify-between gap-2 text-[11px]">
                  <span className="inline-flex items-center gap-1 text-primary opacity-80 group-hover:opacity-100">
                    <Sparkles className="size-3" /> Analyze
                  </span>
                  <a
                    href={n.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground"
                  >
                    Open <ExternalLink className="size-3" />
                  </a>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <ArticleAnalysisModal article={selected} onOpenChange={(o) => !o && setSelected(null)} />
    </section>
  );
}
