import { useCallback, useEffect, useState } from "react";
import { Newspaper, RefreshCw, ExternalLink, Sparkles } from "lucide-react";
import { fetchAllNews, formatRelative, type NewsItem } from "@/lib/news-service";
import { Skeleton } from "@/components/ui/skeleton";
import { ArticleAnalysisModal } from "@/components/ArticleAnalysisModal";


const REFRESH_MS = 30 * 60 * 1000;

export function LatestIntelligenceFeed() {
  const [items, setItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<NewsItem | null>(null);


  const load = useCallback(async (initial = false) => {
    if (initial) setLoading(true);
    else setRefreshing(true);
    try {
      const data = await fetchAllNews();
      setItems(data);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load feed");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load(true);
    const id = setInterval(() => load(false), REFRESH_MS);
    return () => clearInterval(id);
  }, [load]);

  return (
    <section className="glass-card rounded-xl p-5">
      <header className="flex items-center justify-between mb-4 gap-3">
        <h2 className="font-semibold flex items-center gap-2">
          <Newspaper className="size-4 text-primary" /> Latest Intelligence Feed
        </h2>
        <button
          onClick={() => load(false)}
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
        <ul className="space-y-2.5 max-h-[640px] overflow-y-auto pr-1">
          {items.map((n) => {
            const isBBC = n.source === "BBC News";
            return (
              <li
                key={n.id}
                className="group p-3 rounded-md border border-border/50 bg-background/40 hover:bg-accent/30 transition-colors"
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
                  <span className="text-[11px] text-muted-foreground">
                    {formatRelative(n.pubDate)}
                  </span>
                </div>
                <a
                  href={n.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm font-medium leading-snug hover:text-primary inline-flex items-start gap-1"
                >
                  <span>{n.title}</span>
                  <ExternalLink className="size-3 mt-1 opacity-0 group-hover:opacity-70 shrink-0" />
                </a>
                {n.summary && (
                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                    {n.summary}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
