import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const SYSTEM_INSTRUCTION = `You are StrategicMind AI, a geopolitical intelligence analyst. Respond like an official intelligence briefing:
- Use clean markdown: **bold** for key terms, bullet lists for findings, numbered lists for sequences.
- Be concise, analytical, and evidence-driven.
- Structure: brief executive line, then key points, then implications.
- Avoid speculation unless explicitly asked for scenarios.`;

const MessageSchema = z.object({
  role: z.enum(["user", "model"]),
  content: z.string().min(1).max(8000),
});

const InputSchema = z.object({
  history: z.array(MessageSchema).max(40),
  question: z.string().min(1).max(4000),
});

export const askGemini = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => InputSchema.parse(input))
  .handler(async ({ data }) => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return { text: "", error: "GEMINI_API_KEY is not configured on the server." };
    }

    try {
      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey });

      const contents = [
        ...data.history.map((m) => ({ role: m.role, parts: [{ text: m.content }] })),
        { role: "user" as const, parts: [{ text: data.question }] },
      ];

      const res = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents,
        config: { systemInstruction: SYSTEM_INSTRUCTION },
      });

      const text = res.text ?? "";
      return { text, error: text ? null : "No response received." };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Request failed";
      console.error("askGemini error:", msg);
      return { text: "", error: msg };
    }
  });

const SimInputSchema = z.object({
  scenario: z.string().min(5).max(2000),
});

export interface ScenarioResult {
  bestCase: string;
  mostLikely: string;
  worstCase: string;
  economicImpact: string;
  riskScore: number;
  summary?: string;
}

const SIM_INSTRUCTION = `You are StrategicMind AI, a senior geopolitical risk analyst.
Analyze the user's geopolitical scenario and respond ONLY with a valid JSON object (no markdown fences, no prose) matching this exact shape:
{
  "bestCase": string,            // 2-4 sentences describing the best plausible outcome
  "mostLikely": string,          // 2-4 sentences describing the most probable outcome
  "worstCase": string,           // 2-4 sentences describing the worst plausible outcome
  "economicImpact": string,      // 2-4 sentences on markets, supply chains, commodities, currencies
  "riskScore": number,           // overall severity 0-100 (higher = more dangerous)
  "summary": string              // one-line executive headline
}
Be concise, evidence-driven, and analytical. Do not include any text outside the JSON.`;

function extractJson(text: string): string {
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fence) return fence[1].trim();
  const first = text.indexOf("{");
  const last = text.lastIndexOf("}");
  if (first !== -1 && last > first) return text.slice(first, last + 1);
  return text.trim();
}

export const simulateScenario = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => SimInputSchema.parse(input))
  .handler(async ({ data }): Promise<{ result: ScenarioResult | null; error: string | null }> => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return { result: null, error: "GEMINI_API_KEY is not configured on the server." };
    }

    try {
      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey });

      const res = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [{ role: "user", parts: [{ text: `Scenario:\n${data.scenario}` }] }],
        config: {
          systemInstruction: SIM_INSTRUCTION,
          responseMimeType: "application/json",
        },
      });

      const text = res.text ?? "";
      if (!text) return { result: null, error: "No response received." };

      const parsed = JSON.parse(extractJson(text)) as Partial<ScenarioResult>;
      const score = Math.max(0, Math.min(100, Math.round(Number(parsed.riskScore ?? 50))));
      const result: ScenarioResult = {
        bestCase: String(parsed.bestCase ?? "").trim(),
        mostLikely: String(parsed.mostLikely ?? "").trim(),
        worstCase: String(parsed.worstCase ?? "").trim(),
        economicImpact: String(parsed.economicImpact ?? "").trim(),
        riskScore: score,
        summary: parsed.summary ? String(parsed.summary).trim() : undefined,
      };
      return { result, error: null };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Request failed";
      console.error("simulateScenario error:", msg);
      return { result: null, error: msg };
    }
  });

const ArticleInputSchema = z.object({
  title: z.string().min(1).max(1000),
  summary: z.string().max(4000).optional().default(""),
});

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

const ARTICLE_INSTRUCTION = `You are a geopolitical intelligence analyst. Analyze this news article. Provide:
- Executive Summary
- Countries Involved
- Strategic Importance Score (1-10)
- Risk Score (1-10)
- Political Impact
- Economic Impact
- Military Impact
- Diplomatic Impact

Respond ONLY with a valid JSON object (no markdown, no prose) matching this exact shape:
{
  "executiveSummary": string,
  "countriesInvolved": string[],
  "strategicImportance": number,
  "riskScore": number,
  "politicalImpact": string,
  "economicImpact": string,
  "militaryImpact": string,
  "diplomaticImpact": string
}`;

export const analyzeArticle = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ArticleInputSchema.parse(input))
  .handler(async ({ data }): Promise<{ result: ArticleAnalysis | null; error: string | null }> => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return { result: null, error: "GEMINI_API_KEY is not configured on the server." };
    }
    try {
      const { GoogleGenAI } = await import("@google/genai");
      const ai = new GoogleGenAI({ apiKey });
      const res = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          {
            role: "user",
            parts: [{ text: `Article Title:\n${data.title}\n\nArticle Summary:\n${data.summary || "(no summary provided)"}` }],
          },
        ],
        config: {
          systemInstruction: ARTICLE_INSTRUCTION,
          responseMimeType: "application/json",
        },
      });
      const text = res.text ?? "";
      if (!text) return { result: null, error: "No response received." };
      const parsed = JSON.parse(extractJson(text)) as Partial<ArticleAnalysis>;
      const clamp10 = (n: unknown) => Math.max(1, Math.min(10, Math.round(Number(n ?? 5))));
      const result: ArticleAnalysis = {
        executiveSummary: String(parsed.executiveSummary ?? "").trim(),
        countriesInvolved: Array.isArray(parsed.countriesInvolved)
          ? parsed.countriesInvolved.map((c) => String(c).trim()).filter(Boolean).slice(0, 20)
          : [],
        strategicImportance: clamp10(parsed.strategicImportance),
        riskScore: clamp10(parsed.riskScore),
        politicalImpact: String(parsed.politicalImpact ?? "").trim(),
        economicImpact: String(parsed.economicImpact ?? "").trim(),
        militaryImpact: String(parsed.militaryImpact ?? "").trim(),
        diplomaticImpact: String(parsed.diplomaticImpact ?? "").trim(),
      };
      return { result, error: null };
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Request failed";
      console.error("analyzeArticle error:", msg);
      return { result: null, error: msg };
    }
  });


