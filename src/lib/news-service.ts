import { getLatestNews } from "./news.functions";

export type { NewsItem } from "./news.functions";

export async function fetchAllNews() {
  const res = await getLatestNews();
  return res.items;
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
