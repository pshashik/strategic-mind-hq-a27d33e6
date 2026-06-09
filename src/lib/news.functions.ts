import { createServerFn } from "@tanstack/react-start";
import { decodeHtmlEntities } from "./utils";

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
      const title = decodeHtmlEntities(pick(raw, "title"));
      const link = pick(raw, "link");
      const desc = decodeHtmlEntities(pick(raw, "description"));
      const date = pick(raw, "pubDate") || pick(raw, "dc:date") || pick(raw, "date");
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

async function fetchFeed(url: string, source: NewsItem["source"]): Promise<NewsItem[]> {
  const res = await fetch(url, {
    headers: {
      "user-agent": "Mozilla/5.0 (compatible; StrategicMindAI/1.0; +https://strategicmind.ai)",
      accept: "application/rss+xml, application/xml, text/xml, */*",
    },
  });
  if (!res.ok) throw new Error(`Feed ${source} failed: ${res.status}`);
  const xml = await res.text();
  return parseFeed(xml, source);
}

export const getLatestNews = createServerFn({ method: "GET" }).handler(
  async (): Promise<{ items: NewsItem[]; cachedAt: number }> => {
    try {
      // Return cached data if still valid
      if (cache && Date.now() - cache.at < CACHE_TTL_MS) {
        return {
          items: cache.items,
          cachedAt: cache.at,
        };
      }

      const results = await Promise.allSettled(
        FEEDS.map((feed) => fetchFeed(feed.url, feed.source)),
      );

      const rawItems = results.flatMap((result) =>
        result.status === "fulfilled" ? result.value : [],
      );

      // Remove invalid entries
      const validItems = rawItems.filter((item) => item.title?.trim() && item.link?.trim());

      // Deduplicate by URL
      const uniqueItems = Array.from(
        new Map(validItems.map((item) => [item.link.trim(), item])).values(),
      );

      // Sort newest first
      uniqueItems.sort((a, b) => b.pubDate - a.pubDate);

      const topItems = uniqueItems.slice(0, 20);

      // If feeds fail but cache exists, serve stale cache
      if (topItems.length === 0 && cache) {
        return {
          items: cache.items,
          cachedAt: cache.at,
        };
      }

      cache = {
        at: Date.now(),
        items: topItems,
      };

      return {
        items: topItems,
        cachedAt: cache.at,
      };
    } catch (error) {
      console.error("[News Feed Error]", error);

      if (cache) {
        return {
          items: cache.items,
          cachedAt: cache.at,
        };
      }

      return {
        items: [],
        cachedAt: Date.now(),
      };
    }
  },
);
