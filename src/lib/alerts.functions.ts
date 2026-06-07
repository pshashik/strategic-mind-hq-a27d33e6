import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { GEMINI_FLASH_MODEL, prepareFeedArticles, RSS_FEED_ARTICLE_LIMIT } from "@/lib/gemini-feed";

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

const ALERT_CATEGORIES: AlertCategory[] = [
  "Emerging Conflict",
  "Economic Disruption",
  "Military Escalation",
  "Diplomatic Tension",
];

const ALERT_SEVERITIES: AlertSeverity[] = ["Low", "Medium", "High", "Critical"];

const ALERTS_SYSTEM_INSTRUCTION = `You are a military intelligence officer and tactical threat assessment monitor. Analyze the provided news articles. Isolate hidden patterns to generate highly specific Strategic Alerts categorized into:
- Emerging conflicts
- Economic disruptions
- Military escalations
- Diplomatic tensions

For every single alert discovered, assign a severe tier classification: Low, Medium, High, or Critical. Return only raw structured JSON matching the requested array format.

For the timestamp field, use ONLY relative time strings derived from each alert's source article publication time (e.g. "12m ago", "2h ago", "Just now"). Never use ISO 8601 or absolute dates.`;

const STRATEGIC_ALERTS_JSON_SCHEMA = {
  type: "array",
  items: {
    type: "object",
    properties: {
      id: { type: "string" },
      title: { type: "string" },
      category: {
        type: "string",
        enum: ALERT_CATEGORIES,
      },
      severity: {
        type: "string",
        enum: ALERT_SEVERITIES,
      },
      timestamp: {
        type: "string",
        description: 'Relative time only, e.g. "12m ago" or "2h ago" — never ISO dates',
      },
    },
    required: ["id", "title", "category", "severity", "timestamp"],
  },
} as const;

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

    // Check keywords in order of severity
    if (/war|attack|missile|invasion|military strike/i.test(text)) {
      severity = "Critical";
      category = "Military Escalation";
    } else if (/conflict|troop movement|sanctions|blockade/i.test(text)) {
      severity = "High";
      if (/sanctions|blockade/i.test(text)) {
        category = "Economic Disruption";
      } else if (/troop movement/i.test(text)) {
        category = "Military Escalation";
      } else {
        category = "Emerging Conflict";
      }
    } else if (/tension|protest|instability/i.test(text)) {
      severity = "Medium";
      if (/protest|instability/i.test(text)) {
        category = "Emerging Conflict";
      } else {
        category = "Diplomatic Tension";
      }
    } else {
      severity = "Low";
      // Fallback categories for low-severity alerts
      const fallbacks: AlertCategory[] = [
        "Diplomatic Tension",
        "Emerging Conflict",
        "Economic Disruption",
        "Military Escalation",
      ];
      category = fallbacks[i % fallbacks.length];
    }

    const timestamp = article.pubDate ? formatRelativeShort(article.pubDate) : "Just now";

    alerts.push({
      id: `alert-${article.id || i}`,
      title: article.title,
      category,
      severity,
      timestamp,
    });
  }

  return alerts.slice(0, 10);
}

function normalizeTimestamp(
  value: unknown,
  articles: z.infer<typeof FeedArticleSchema>[],
  index: number,
): string {
  const s = String(value ?? "").trim();
  if (/^\d+[mhd]\s*ago$/i.test(s) || s.toLowerCase() === "just now") return s;

  const fallback = articles[index]?.pubDate ?? articles[0]?.pubDate;

  // Gemini often returns placeholder ISO dates — use real article pubDate instead
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    if (fallback) return formatRelativeShort(fallback);
    return "Just now";
  }

  const parsed = Date.parse(s);
  if (!Number.isNaN(parsed)) return formatRelativeShort(parsed);

  if (fallback) return formatRelativeShort(fallback);
  return "Just now";
}

function compactFeed(articles: z.infer<typeof FeedArticleSchema>[]): string {
  return articles
    .map((item, i) => {
      const summary = item.summary.trim();
      const when = item.pubDate ? `[${formatRelativeShort(item.pubDate)}]` : "";
      const headline = when ? `${i + 1}. ${when} ${item.title}` : `${i + 1}. ${item.title}`;
      return summary ? `${headline}\n   ${summary}` : headline;
    })
    .join("\n\n");
}

function extractJson(text: string): string {
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) return fence[1].trim();
  const trimmed = text.trim();
  if (trimmed.startsWith("[")) {
    const last = trimmed.lastIndexOf("]");
    if (last > 0) return trimmed.slice(0, last + 1);
  }
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first !== -1 && last > first) return text.slice(first, last + 1);
  return trimmed;
}

function normalizeCategory(value: unknown): AlertCategory {
  const s = String(value ?? "").trim();
  const match = ALERT_CATEGORIES.find((c) => c.toLowerCase() === s.toLowerCase());
  if (match) return match;
  if (/conflict/i.test(s)) return "Emerging Conflict";
  if (/economic|disruption/i.test(s)) return "Economic Disruption";
  if (/military|escalat/i.test(s)) return "Military Escalation";
  return "Diplomatic Tension";
}

function normalizeSeverity(value: unknown): AlertSeverity {
  const s = String(value ?? "").trim();
  const match = ALERT_SEVERITIES.find((v) => v.toLowerCase() === s.toLowerCase());
  return match ?? "Medium";
}

export const synthesizeStrategicAlerts = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }): Promise<{ result: StrategicAlert[] | null; error: string | null }> => {
    try {
      const result = generateLocalAlerts(data.articles);
      return { result, error: null };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Request failed";
      return { result: null, error: msg };
    }
  });
