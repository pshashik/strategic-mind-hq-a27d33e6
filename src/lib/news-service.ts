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

function stripHtml(s: string): string {
  return s
    .replace(/<!\[CDATA\[(.*?)\]\]>/gs, "$1")
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
  // RSS uses <item>, RDF (DW) also uses <item>
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

async function fetchFeed(url: string, source: NewsItem["source"]): Promise<NewsItem[]> {
  const proxied = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
  const res = await fetch(proxied, { cache: "no-store" });
  if (!res.ok) throw new Error(`Feed ${source} failed: ${res.status}`);
  const data = (await res.json()) as { contents: string };
  return parseFeed(data.contents ?? "", source);
}

export async function fetchAllNews(): Promise<NewsItem[]> {
  const results = await Promise.allSettled(
    FEEDS.map((f) => fetchFeed(f.url, f.source)),
  );
  const items = results.flatMap((r) =>
    r.status === "fulfilled" ? r.value : [],
  );
  items.sort((a, b) => b.pubDate - a.pubDate);
  return items.slice(0, 20);
}

export function formatRelative(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min${mins === 1 ? "" : "s"} ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24)
    return new Date(ts).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  const days = Math.round(hrs / 24);
  return `${days}d ago`;
}
