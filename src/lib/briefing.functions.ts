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

export interface CountryToWatch {
  country: string;
  reasoning: string;
}

export interface ExecutiveBriefing {
  globalOverview: string;
  topGeopoliticalRisk: string;
  mostImportantDevelopment: string;
  countriesToWatch: CountryToWatch[];
}

const BRIEFING_SYSTEM_INSTRUCTION = `You are an expert geopolitical intelligence analyst. Analyze the provided news feed and generate an Executive Summary with the following strict structure:
- Global Overview (Provide a high-level summary of the overall global situation based on the news. Max 100 words.)
- Top Geopolitical Risk (Identify the single highest-priority risk. Explain the immediate threat and potential escalation.)
- Most Important Development (Highlight the most impactful event or structural shift from the feed and why it matters.)
- Countries To Watch (Provide critical countries to watch right now with a brief explanation of why.)`;

const EXECUTIVE_SUMMARY_JSON_SCHEMA = {
  type: "object",
  properties: {
    globalOverview: { type: "string" },
    topGeopoliticalRisk: { type: "string" },
    mostImportantDevelopment: { type: "string" },
    countriesToWatch: {
      type: "array",
      items: {
        type: "object",
        properties: {
          country: { type: "string" },
          reasoning: { type: "string" },
        },
        required: ["country", "reasoning"],
      },
    },
  },
  required: ["globalOverview", "topGeopoliticalRisk", "mostImportantDevelopment", "countriesToWatch"],
} as const;

function compactFeed(articles: z.infer<typeof FeedArticleSchema>[]): string {
  return articles
    .map((item, i) => {
      const summary = item.summary.trim();
      return summary
        ? `${i + 1}. ${item.title}\n   ${summary}`
        : `${i + 1}. ${item.title}`;
    })
    .join("\n\n");
}

function extractJson(text: string): string {
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) return fence[1].trim();
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first !== -1 && last > first) return text.slice(first, last + 1);
  return text.trim();
}

export const synthesizeExecutiveSummary = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }): Promise<{ result: ExecutiveBriefing | null; error: string | null }> => {
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
        contents: [{ role: "user", parts: [{ text: `News Feed (top ${stripped.length} items):\n\n${feedText}` }] }],
        config: {
          systemInstruction: BRIEFING_SYSTEM_INSTRUCTION,
          responseMimeType: "application/json",
          responseJsonSchema: EXECUTIVE_SUMMARY_JSON_SCHEMA,
        },
      });

      const text = res.text ?? "";
      if (!text) return { result: null, error: "No response received." };

      const parsed = JSON.parse(extractJson(text)) as Partial<ExecutiveBriefing>;
      const countriesToWatch = Array.isArray(parsed.countriesToWatch)
        ? parsed.countriesToWatch
            .map((c) => ({
              country: String((c as CountryToWatch).country ?? "").trim(),
              reasoning: String((c as CountryToWatch).reasoning ?? "").trim(),
            }))
            .filter((c) => c.country)
            .slice(0, 10)
        : [];

      const result: ExecutiveBriefing = {
        globalOverview: String(parsed.globalOverview ?? "").trim(),
        topGeopoliticalRisk: String(parsed.topGeopoliticalRisk ?? "").trim(),
        mostImportantDevelopment: String(parsed.mostImportantDevelopment ?? "").trim(),
        countriesToWatch,
      };

      return { result, error: null };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Request failed";
      console.error("synthesizeExecutiveSummary error:", msg);
      return { result: null, error: msg };
    }
  });
