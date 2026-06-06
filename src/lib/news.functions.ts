import { createServerFn } from "@tanstack/react-start";

export type NewsItem = {
  id: string;
  title: string;
  link: string;
  source: "BBC News" | "Deutsche Welle";
  pubDate: number;
  summary: string;
};

const FEEDS: { url: string; source: NewsItem["source"] }[] = [
  { url: "https://feeds.bbci.co.uk/news/world/rss.xml", source: "BBC News" },
  { url: "https://rss.dw.com/rdf/rss-en-all", source: "Deutsche Welle" },
];

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
let cache: { at: number; items: NewsItem[] } | null = null;

function stripHtml(s: string): string {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function pick(xml: string, tag: string): string {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i");
  const m = xml.match(re);
  return m ? stripHtml(m[1]) : "";
}

function parseFeed(xml: string, source: NewsItem["source"]): NewsItem[] {
  const items = xml.match(/<item\b[\s\S]*?<\/item>/gi) ?? [];
  return items
    .map((raw, i) => {
      const title = pick(raw, "title");
      const link = pick(raw, "link");
      const desc = pick(raw, "description");
      const date =
        pick(raw, "pubDate") || pick(raw, "dc:date") || pick(raw, "date");
      const ts = date ? Date.parse(date) : NaN;
      return {
        id: `${source}-${i}-${link || title}`,
        title,
        link,
        source,
        pubDate: isNaN(ts) ? Date.now() : ts,
        summary: desc,
      };
    })
    .filter((it) => it.title && it.link);
}

async function fetchFeed(
  url: string,
  source: NewsItem["source"],
): Promise<NewsItem[]> {
  const res = await fetch(url, {
    headers: {
      "user-agent":
        "Mozilla/5.0 (compatible; StrategicMindAI/1.0; +https://strategicmind.ai)",
      accept: "application/rss+xml, application/xml, text/xml, */*",
    },
  });
  if (!res.ok) throw new Error(`Feed ${source} failed: ${res.status}`);
  const xml = await res.text();
  return parseFeed(xml, source);
}

export const getLatestNews = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ items: NewsItem[]; cachedAt: number }> => {
    if (cache && Date.now() - cache.at < CACHE_TTL_MS) {
      return { items: cache.items, cachedAt: cache.at };
    }

    const results = await Promise.allSettled(
      FEEDS.map((f) => fetchFeed(f.url, f.source)),
    );
    const items = results.flatMap((r) =>
      r.status === "fulfilled" ? r.value : [],
    );
    items.sort((a, b) => b.pubDate - a.pubDate);
    const top = items.slice(0, 20);

    // Serve stale cache if every feed failed
    if (top.length === 0 && cache) {
      return { items: cache.items, cachedAt: cache.at };
    }

    cache = { at: Date.now(), items: top };
    return { items: top, cachedAt: cache.at };
  },
);
