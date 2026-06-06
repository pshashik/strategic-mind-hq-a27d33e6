import { useCallback, useEffect, useState } from "react";
import { fetchAllNews, type NewsItem } from "@/lib/news-service";

const REFRESH_MS = 30 * 60 * 1000;

export function useArticles() {
  const [articles, setArticles] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (initial = false) => {
    if (initial) setLoading(true);
    else setRefreshing(true);
    try {
      const data = await fetchAllNews();
      setArticles(data);
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

  return { articles, loading, refreshing, error, reload: () => load(false) };
}
