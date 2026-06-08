import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { computeLocalTopRisks } from "@/lib/news-service";

const RSS_FEED_ARTICLE_LIMIT = 20;

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

export const synthesizeTopRisks = createServerFn({ method: "POST" })
  .validator((input: unknown) => InputSchema.parse(input))
  .handler(
    async ({
      data,
    }): Promise<{
      result: GeopoliticalRisk[] | null;
      error: string | null;
      rateLimited?: boolean;
    }> => {
      try {
        return {
          result: computeLocalTopRisks(data.articles),
          error: null,
        };
      } catch (e) {
        const msg = e instanceof Error ? e.message : "Failed to synthesize top risks.";
        return { result: null, error: msg };
      }
    },
  );
