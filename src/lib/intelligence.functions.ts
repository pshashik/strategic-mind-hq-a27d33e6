import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateLocalArticleAnalysis } from "@/lib/local-article-analysis";

const MessageSchema = z.object({
  role: z.enum(["user", "model"]),
  content: z.string().min(1).max(8000),
});

const AssistantInputSchema = z.object({
  history: z.array(MessageSchema).max(40),
  question: z.string().min(1).max(4000),
});

const ScenarioInputSchema = z.object({
  scenario: z.string().min(5).max(2000),
});

const ArticleInputSchema = z.object({
  title: z.string().min(1).max(1000),
  summary: z.string().max(4000).optional().default(""),
});

export interface ScenarioResult {
  bestCase: string;
  mostLikely: string;
  worstCase: string;
  economicImpact: string;
  riskScore: number;
  summary?: string;
}

export interface ArticleAnalysis {
  executiveSummary: string;
  countriesInvolved: string[];
  strategicImportance: number;
  riskScore: number;
  politicalImpact: string;
  economicImpact: string;
  militaryImpact: string;
  diplomaticImpact: string;
}

function clampScore(value: number, max: number): number {
  return Math.max(0, Math.min(max, Math.round(value)));
}

function scenarioRiskScore(text: string): number {
  const lower = text.toLowerCase();
  const weights: [RegExp, number][] = [
    [/\b(nuclear|invasion|war|missile|blockade|closure|attack|cyberattack)\b/g, 18],
    [/\b(taiwan|hormuz|ukraine|iran|israel|russia|china|nato)\b/g, 10],
    [/\b(oil|gas|grid|port|shipping|supply chain|sanctions)\b/g, 8],
    [/\b(protest|election|tension|dispute|quarantine)\b/g, 5],
  ];

  return clampScore(
    25 + weights.reduce((total, [pattern, weight]) => total + ((lower.match(pattern) ?? []).length * weight), 0),
    100,
  );
}

export const askAssistant = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => AssistantInputSchema.parse(input))
  .handler(async ({ data }): Promise<{ text: string; error: string | null }> => {
    const question = data.question.trim();
    const contextHint = data.history.length
      ? "I also considered the prior conversation context."
      : "No prior thread context was needed.";

    return {
      error: null,
      text: [
        `**Executive line:** ${question} should be assessed through actors, triggers, escalation pathways, and economic exposure.`,
        "",
        "**Key points**",
        "- Identify the primary state and non-state actors, then separate declared intent from observable capability.",
        "- Watch for military movement, missile activity, sanctions pressure, attacks, and diplomatic tension as leading indicators.",
        "- Treat market effects as second-order signals unless energy, shipping, food, or critical infrastructure is directly involved.",
        "",
        "**Implications**",
        `- Near-term risk rises if fresh reporting links the issue to war, attack, missile, military, sanctions, or tensions language. ${contextHint}`,
      ].join("\n"),
    };
  });

export const simulateScenario = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ScenarioInputSchema.parse(input))
  .handler(
    async ({
      data,
    }): Promise<{
      result: ScenarioResult | null;
      error: string | null;
      errorCode?: string;
    }> => {
    const scenario = data.scenario.trim();
    const riskScore = scenarioRiskScore(scenario);
    const elevated = riskScore >= 65;

    return {
      error: null,
      result: {
        summary: `Local scenario estimate: ${elevated ? "elevated" : "managed"} risk trajectory for ${scenario}.`,
        bestCase:
          "Diplomatic channels absorb the shock, signaling stays controlled, and affected actors preserve off-ramps. Markets price a short disruption rather than a structural break.",
        mostLikely:
          "The scenario produces a period of heightened alert, selective policy responses, and cautious military or diplomatic signaling. Risk remains manageable if no follow-on attack or blockade expands the theater.",
        worstCase:
          "Miscalculation or retaliatory action broadens the crisis, drawing in aligned states and extending disruption across security, trade, and financial channels.",
        economicImpact:
          "Expect risk premia in exposed commodities, shipping, insurance, and regional currencies. The effect becomes systemic if energy flows, ports, payment rails, or critical infrastructure are directly impaired.",
        riskScore,
      },
    };
  });

export const analyzeArticle = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ArticleInputSchema.parse(input))
  .handler(
    async ({
      data,
    }): Promise<{
      result: ArticleAnalysis | null;
      error: string | null;
      errorCode?: string;
    }> => {
      const result = generateLocalArticleAnalysis({
        title: data.title,
        summary: data.summary,
      });

      return { result, error: null };
    },
  );
