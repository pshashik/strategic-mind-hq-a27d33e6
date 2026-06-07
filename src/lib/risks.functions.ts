import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { GEMINI_FLASH_MODEL, prepareFeedArticles, RSS_FEED_ARTICLE_LIMIT } from "@/lib/gemini-feed";
const FeedArticleSchema = z.object({
  title: z.string().min(1).max(1000),
  summary: z.string().max(4000).optional().default(""),
});

const InputSchema = z.object({
  articles: z.array(FeedArticleSchema).min(1).max(RSS_FEED_ARTICLE_LIMIT),
});

export interface GeopoliticalRisk {
  riskName: string;
  severityScore: number;
  regionAffected: string;
}

const RISKS_SYSTEM_INSTRUCTION = `You are a chief geopolitical risk analyst. Analyze all provided news articles to synthesize a definitive list of the Top 5 current geopolitical risks. For each risk, determine a Severity Score (0-100) based on probability and impact, and specify the primary Region Affected. Return only structured JSON.`;

const TOP_RISKS_JSON_SCHEMA = {
  type: "array",
  items: {
    type: "object",
    properties: {
      riskName: { type: "string" },
      severityScore: { type: "integer", minimum: 0, maximum: 100 },
      regionAffected: { type: "string" },
    },
    required: ["riskName", "severityScore", "regionAffected"],
  },
} as const;

function compactFeed(articles: z.infer<typeof FeedArticleSchema>[]): string {
  return articles
    .map((item, i) => {
      const summary = item.summary.trim();
      return summary ? `${i + 1}. ${item.title}\n   ${summary}` : `${i + 1}. ${item.title}`;
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

export const synthesizeTopRisks = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(
    async ({
      data,
    }): Promise<{
      result: GeopoliticalRisk[] | null;
      error: string | null;
      rateLimited?: boolean;
    }> => {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        return { result: null, error: "GEMINI_API_KEY is not configured on the server." };
      }

      const stripped = prepareFeedArticles(
        data.articles.map(({ title, summary }) => ({ title, summary: summary ?? "" })),
      );
      const feedText = compactFeed(stripped);

      try {
        const { GoogleGenAI } = await import("@google/genai");
        const ai = new GoogleGenAI({ apiKey });

        const res = await ai.models.generateContent({
          model: GEMINI_FLASH_MODEL,
          contents: [
            {
              role: "user",
              parts: [{ text: `News Feed (top ${stripped.length} items):\n\n${feedText}` }],
            },
          ],
          config: {
            systemInstruction: RISKS_SYSTEM_INSTRUCTION,
            responseMimeType: "application/json",
            responseJsonSchema: TOP_RISKS_JSON_SCHEMA,
          },
        });

        const text = res.text ?? "";
        if (!text) return { result: null, error: "No response received." };

        const parsed = JSON.parse(extractJson(text));
        const raw = Array.isArray(parsed) ? parsed : [];
        const result: GeopoliticalRisk[] = raw
          .map((r) => ({
            riskName: String((r as GeopoliticalRisk).riskName ?? "").trim(),
            severityScore: Math.max(
              0,
              Math.min(100, Math.round(Number((r as GeopoliticalRisk).severityScore ?? 0))),
            ),
            regionAffected: String((r as GeopoliticalRisk).regionAffected ?? "").trim(),
          }))
          .filter((r) => r.riskName)
          .slice(0, 5);

        return { result, error: null };
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Request failed";
        const rateLimited = /429|rate limit|quota|resource exhausted/i.test(msg);
        console.error("synthesizeTopRisks error:", msg);
        return { result: null, error: msg, rateLimited };
      }
    },
  );
