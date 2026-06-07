import { useEffect, useMemo } from "react";
import { Sparkles } from "lucide-react";
import {
  isExecutiveSummaryCacheFresh,
  readExecutiveSummaryCache,
  writeExecutiveSummaryCache,
} from "@/lib/simple-briefing-cache";
import {
  generateExecutiveSummary,
  toExecutiveSummaryArticleFromNewsItem,
} from "@/lib/simple-briefing";
import type { NewsItem } from "@/lib/news-service";

interface Props {
  articles: NewsItem[];
}

export function ExecutiveSummaryPanel({ articles }: Props) {
  const feedKey = useMemo(
    () => articles.map((article) => `${article.id}:${article.title}:${article.pubDate}`).join("|"),
    [articles],
  );

  const briefingArticles = useMemo(
    () => articles.map((article) => toExecutiveSummaryArticleFromNewsItem(article)),
    [articles],
  );

  const briefing = useMemo(() => {
    const cached = readExecutiveSummaryCache(feedKey);
    if (cached && isExecutiveSummaryCacheFresh(cached)) return cached.result;
    return generateExecutiveSummary(briefingArticles);
  }, [briefingArticles, feedKey]);

  useEffect(() => {
    if (articles.length === 0) return;
    writeExecutiveSummaryCache(feedKey, briefing);
  }, [articles.length, briefing, feedKey]);

  return (
    <section className="glass-card rounded-xl p-5">
      <header className="mb-4 flex items-center gap-2">
        <h2 className="flex items-center gap-2 font-semibold">
          <Sparkles className="size-4 text-primary" /> Executive Summary
        </h2>
      </header>

      <div className="rounded-lg border border-border/60 bg-background/30 px-4 py-4">
        {articles.length === 0 ? (
          <p className="text-sm text-muted-foreground">Waiting for live intelligence feed…</p>
        ) : (
          <p className="whitespace-pre-line text-sm leading-7 text-foreground/90 md:text-[15px]">
            {briefing.summary}
          </p>
        )}
      </div>
    </section>
  );
}
