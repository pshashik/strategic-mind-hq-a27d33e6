import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const RSS_FEED_ARTICLE_LIMIT = 20;

const FeedArticleSchema = z.object({
  title: z.string().min(1).max(1000),
  summary: z.string().max(4000).optional().default(""),
  pubDate: z.number().optional(),
});

const InputSchema = z.object({
  articles: z.array(FeedArticleSchema).min(1).max(RSS_FEED_ARTICLE_LIMIT),
});

export type AlertCategory =
  | "Emerging Conflict"
  | "Economic Disruption"
  | "Military Escalation"
  | "Diplomatic Tension";

export type AlertSeverity = "Low" | "Medium" | "High" | "Critical";

export interface StrategicAlert {
  id: string;
  title: string;
  category: AlertCategory;
  severity: AlertSeverity;
  timestamp: string;
}

function formatRelativeShort(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.round(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  return `${days}d ago`;
}

export function generateLocalAlerts(
  articles: { title: string; summary?: string; pubDate?: number; id?: string }[],
): StrategicAlert[] {
  const alerts: StrategicAlert[] = [];

  for (let i = 0; i < articles.length; i++) {
    const article = articles[i];
    const text = `${article.title} ${article.summary ?? ""}`.toLowerCase();

    let category: AlertCategory = "Diplomatic Tension";
    let severity: AlertSeverity = "Low";

    if (/war|attack|missile|invasion|military strike/i.test(text)) {
      severity = "Critical";
      category = "Military Escalation";
    } else if (/conflict|troop movement|sanctions|blockade/i.test(text)) {
      severity = "High";
      category = /sanctions|blockade/i.test(text)
        ? "Economic Disruption"
        : /troop movement/i.test(text)
          ? "Military Escalation"
          : "Emerging Conflict";
    } else if (/tension|protest|instability/i.test(text)) {
      severity = "Medium";
      category = /protest|instability/i.test(text) ? "Emerging Conflict" : "Diplomatic Tension";
    }

    alerts.push({
      id: `alert-${article.id || i}`,
      title: article.title,
      category,
      severity,
      timestamp: article.pubDate ? formatRelativeShort(article.pubDate) : "Just now",
    });
  }

  return alerts.slice(0, 10);
}

export const synthesizeStrategicAlerts = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }): Promise<{ result: StrategicAlert[] | null; error: string | null }> => {
    try {
      return { result: generateLocalAlerts(data.articles), error: null };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Request failed";
      return { result: null, error: msg };
    }
  });
