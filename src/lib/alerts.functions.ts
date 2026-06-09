import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { deriveArticleSeverity } from "./risk-engine";

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

  const severityMap = {
    low: "Low",
    medium: "Medium",
    high: "High",
    critical: "Critical",
  } as const;

  for (let i = 0; i < articles.length; i++) {
    const article = articles[i];

    const text = `${article.title} ${article.summary ?? ""}`.toLowerCase();

    const derived = deriveArticleSeverity(article.title, article.summary);

    const severity: AlertSeverity = severityMap[derived];

    let category: AlertCategory = "Diplomatic Tension";

    if (derived === "critical") {
      category = "Military Escalation";
    } else if (derived === "high") {
      category = /sanctions|embargo|tariff|blockade/i.test(text)
        ? "Economic Disruption"
        : "Military Escalation";
    } else if (/protest|instability|riot|unrest|coup/i.test(text)) {
      category = "Emerging Conflict";
    } else if (/summit|ceasefire|negotiat|talks|diplomatic/i.test(text)) {
      category = "Diplomatic Tension";
    }

    alerts.push({
      id: `alert-${article.id || i}`,
      title: article.title,
      category,
      severity,
      timestamp: article.pubDate ? formatRelativeShort(article.pubDate) : "Just now",
    });
  }

  return alerts
    .sort((a, b) => {
      const rank = {
        Critical: 4,
        High: 3,
        Medium: 2,
        Low: 1,
      };

      return rank[b.severity] - rank[a.severity];
    })
    .slice(0, 10);
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
