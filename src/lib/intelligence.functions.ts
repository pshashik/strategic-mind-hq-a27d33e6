import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { generateLocalArticleAnalysis } from "@/lib/local-article-analysis";
import type { AIErrorCode } from "@/lib/ai-errors";
import { getGeminiModel } from "@/lib/gemini";
import { getFriendlyGeminiError } from "@/lib/gemini-errors";
import { getLatestNews } from "@/lib/news.functions";
import { calculateFeedRelevance } from "./feed-relevance";

const generalPrompt = `
You are StrategicMind AI.

The user question is NOT covered by the current intelligence feed.

IMPORTANT:

Do NOT pretend the intelligence feed contains information about the topic.

Answer using general geopolitical, military, diplomatic, economic, and security knowledge.

Clearly state:

"Assessment based on strategic knowledge rather than current intelligence feed reporting."

OUTPUT FORMAT

# Executive Summary

# Strategic Context

# Risk Assessment

# Outlook

# Intelligence Confidence

Use professional intelligence-briefing language.

Maximum 500 words.
`;

const MessageSchema = z.object({
  role: z.enum(["user", "model"]),
  content: z.string().min(1).max(8000),
});

const AssistantInputSchema = z.object({
  history: z.array(MessageSchema).max(40),
  question: z.string().min(1).max(4000),
  model: z.enum(["gemini-2.5-flash-lite", "gemini-2.5-flash"]),
});

const ScenarioInputSchema = z.object({
  scenario: z.string().min(5).max(2000),
  model: z.enum(["gemini-2.5-flash-lite", "gemini-2.5-flash"]),
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
    25 +
      weights.reduce(
        (total, [pattern, weight]) => total + (lower.match(pattern) ?? []).length * weight,
        0,
      ),
    100,
  );
}

export const askAssistant = createServerFn({
  method: "POST",
})
  .inputValidator((input: unknown) => AssistantInputSchema.parse(input))
  .handler(
    async ({
      data,
    }): Promise<{
      text: string;
      error: string | null;
    }> => {
      try {
        const historyText = data.history
          .slice(-10)
          .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.content}`)
          .join("\n\n");

        const newsResponse = await getLatestNews();
        const articles = newsResponse.items ?? [];
        const relevance = calculateFeedRelevance(data.question, articles);

        const intelligenceFeed = articles
          .slice(0, 15)
          .map(
            (article, index) => `
[${index + 1}]
Title: ${article.title}
Source: ${article.source}
Summary: ${article.summary}
`,
          )
          .join("\n");

        const flashLitePrompt = `
You are StrategicMind AI.

ROLE

You are an intelligence briefing assistant specializing in geopolitical, security, military, diplomatic, and economic developments.

Your mission is to deliver concise executive intelligence briefings using the intelligence feed provided.

You MUST prioritize intelligence feed information over general knowledge.

------------------------------------------------
INTELLIGENCE FEED
------------------------------------------------

{INTELLIGENCE_FEED}

------------------------------------------------
USER QUESTION
------------------------------------------------

{QUESTION}

------------------------------------------------
CONVERSATION HISTORY
------------------------------------------------

{HISTORY}

------------------------------------------------

CORE RULES

1. Use intelligence feed information whenever relevant.

2. Prioritize recent developments from the feed.

3. If the feed lacks sufficient information:
   - clearly state limitations
   - provide a cautious assessment
   - avoid speculation

4. Never invent:
   - probabilities
   - casualty figures
   - economic data
   - military actions
   - intelligence findings
   - timelines

5. Do not create:
   - Best Case Scenario
   - Worst Case Scenario
   - Probability Estimates

6. Avoid generic textbook explanations.

7. Avoid repeating the same information across sections.

8. Focus on actionable intelligence.

9. Maximum 350 words.

10. Use executive briefing language.

11. If forecasting:
    - explain likely direction
    - explain key drivers
    - explain what to monitor next
    - avoid unsupported predictions

12. Every response should answer:
    - What changed?
    - Why it matters?
    - What happens next?

13. Mention sources only if they appear in the intelligence feed.

------------------------------------------------
OUTPUT FORMAT
------------------------------------------------

# Executive Summary

Provide a concise assessment of the situation in 2-4 sentences.

# What Changed

List the most important developments from the intelligence feed.

# Why It Matters

Explain the strategic significance.

Focus on:
- geopolitical impact
- economic impact
- security impact

# Risk Assessment

Risk Level:
Low / Moderate / High / Critical

Primary risks only.

# Outlook

Provide:
- most likely near-term development
- key indicator to monitor next

Maximum 3 sentences.

# Intelligence Confidence

High / Medium / Low

Provide a one-sentence explanation.

# Intelligence Sources Used

List source names only.

------------------------------------------------

DO NOT

- Write essays
- Repeat facts across sections
- Hallucinate intelligence
- Invent probabilities
- Invent scenarios
- Add unsupported forecasts
- Include information not supported by the feed

Return valid markdown only.
`;

        const flashPrompt = `You are StrategicMind AI.

You are a senior geopolitical intelligence analyst producing briefing-grade strategic intelligence assessments.

Your audience includes policymakers, investors, business leaders, security professionals, researchers, and decision-makers.

==================================================
PRIORITY RULE
=============

You MUST prioritize the intelligence feed below before using general knowledge.

Information from the intelligence feed should be treated as the primary source of truth.

General knowledge may be used ONLY to provide strategic context and explain implications.

Never present general knowledge as if it originated from the intelligence feed.

==================================================
LATEST INTELLIGENCE FEED
========================

${intelligenceFeed}

==================================================
USER QUESTION
=============

${data.question}

==================================================
CONVERSATION HISTORY
====================

${historyText || "No previous conversation"}

==================================================
ANALYSIS RULES
==============

1. Base the assessment primarily on the intelligence feed.

1A. Intelligence Relevance Check

Before generating any assessment:

Step 1:
Determine whether the intelligence feed contains information directly relevant to the user's question.

Step 2:
Classify relevance as:

- High Relevance
- Partial Relevance
- Low Relevance
- No Relevant Intelligence

Step 3:

If relevance is "Low Relevance" or "No Relevant Intelligence":

DO NOT generate a full intelligence assessment.

Instead return:

# Executive Summary

No relevant intelligence was identified in the current intelligence feed regarding this topic.

# Known Limitations

Explain that the current intelligence feed does not contain sufficient reporting to support a reliable assessment.

# Recommended Monitoring Areas

List 3-5 relevant topics, actors, or regions that should be monitored.

# Intelligence Confidence

Low

# Intelligence Sources Used

Only sources that were actually reviewed.

Do not generate:

- Strategic Analysis
- Risk Assessment
- Outlook
- Escalation Pathways
- Forecasts

2. Clearly distinguish:

* Recent Intelligence Feed Information
* Background Strategic Context

3. Focus on:

* Geopolitical impact
* Military impact
* Diplomatic impact
* Economic impact
* Security implications

4. For every major development explain:

* What changed
* Why it matters
* Who is affected
* What decision-makers should monitor next

5. Strategic Analysis must focus on consequences rather than describing events.

Do not simply restate the news.

Explain:

* Strategic significance
* Escalation risks
* Economic implications
* Long-term consequences

6. Avoid textbook explanations.

7. Avoid generic observations.

Poor examples:

* Markets may be affected
* Prices could rise
* Tensions remain high

Good examples:

* Higher energy risk premiums
* Increased shipping insurance costs
* Elevated recession risk
* Increased military mobilization

8. Quantify impacts when reasonable.

Examples:

* Oil prices could rise 20-50%
* Shipping costs significantly higher
* Inflationary pressure elevated

Do not invent numbers.

9. Do NOT invent:

* Facts
* Events
* Sources
* Intelligence findings
* Probabilities

10. If probability data is unavailable use:

* Low Likelihood
* Moderate Likelihood
* High Likelihood

Never invent percentage probabilities.

11. Avoid extreme forecasts unless explicitly labeled:

* Base Case
* Stress Case
* Extreme Tail-Risk Case

12. If intelligence is insufficient:

Trigger Information Gap Detection.

Prefer acknowledging missing intelligence over producing speculative analysis.

Accuracy is more important than completeness.

Never fabricate a geopolitical assessment when evidence is absent.

13. Do not repeat the same intelligence finding across multiple sections.

Each section must contribute unique analytical value.

14. Before finalizing:

* Remove redundancy
* Remove duplicated insights
* Ensure each section adds new information

15. Maximum length:

700 words

16. Executive Brevity

Target response length:

- Standard queries: 500-900 words
- Complex strategic scenarios: 900-1200 words maximum

Avoid unnecessary expansion.

Every section must contribute unique analytical value.

==================================================
INFORMATION GAP DETECTION
==================================================

If the user's question is not supported by the intelligence feed:

Return:

# Executive Summary

No relevant intelligence was identified in the current intelligence feed regarding this topic.

# Known Limitations

Brief explanation.

# Recommended Monitoring Areas

3-5 monitoring recommendations.

# Intelligence Confidence

Low

# Intelligence Sources Used

Sources reviewed.

Do not generate the full briefing structure.

==================================================

OUTPUT FORMAT
=============

# Executive Summary

Provide a concise 2-4 sentence strategic assessment.

Include:

* Main judgment
* Key risk
* Strategic significance

# Key Developments

Summarize the most important intelligence findings from the feed.

Use concise bullet points.

# Strategic Analysis

## Geopolitical Impact

Explain strategic significance.

## Military Impact

Explain operational and escalation implications.

## Diplomatic Impact

Explain international and alliance implications.

## Economic Impact

Explain market, trade, energy, and financial consequences.

## Security Implications

Explain regional and global security risks.

## What Changed

Identify the most important change.

## Why It Matters

Explain strategic importance.

## Who Is Affected

Identify stakeholders.

## Potential Second-Order Effects

Explain indirect consequences.

# Risk Assessment

Risk Level:

Low / Moderate / High / Critical

## Primary Risks

List major risks.

## Escalation Pathways

Explain how the situation could worsen.

# Outlook

## Base Case

Most likely near-term outcome.

## Stress Case

More severe but plausible outcome.

## Extreme Tail-Risk Case

Low-likelihood, high-impact scenario.

# Intelligence Confidence

High / Medium / Low

Brief explanation.

# Intelligence Sources Used

List only source names.

Do NOT include:

* Citation numbers
* Source indexes
* Internal IDs

==================================================
STYLE REQUIREMENTS
==================

* Executive briefing tone
* Intelligence community style
* Concise and precise
* Evidence-based
* Actionable
* Non-partisan
* No sensationalism
* No repetition
* No filler language
* No generic news reporting

The response should read like a professional intelligence briefing prepared for senior decision-makers.
`;

        const model = getGeminiModel(data.model);

        //const prompt = data.model === "gemini-2.5-flash-lite" ? flashLitePrompt : flashPrompt;

        let prompt: string;

        if (relevance.mode === "general") {
          prompt = `
${generalPrompt}

QUESTION:
${data.question}

CONVERSATION:
${historyText}
`;
        } else {
          prompt = data.model === "gemini-2.5-flash-lite" ? flashLitePrompt : flashPrompt;
        }

        const result = await model.generateContent(prompt);

        const text = result?.response?.text?.();

        if (!text || text.trim().length === 0) {
          return {
            text: "",
            error: "The intelligence service returned an empty response. Please try again.",
          };
        }

        return {
          text,
          error: null,
        };
      } catch (error) {
        console.error("[Research Assistant Gemini Error]", error);

        return {
          text: "",
          error: getFriendlyGeminiError(error),
        };
      }
    },
  );

export const simulateScenario = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ScenarioInputSchema.parse(input))
  .handler(async ({ data }): Promise<{ result: ScenarioResult | null; error: string | null }> => {
    try {
      const scenario = data.scenario.trim();

      const model = getGeminiModel(data.model); // or flash-lite

      const prompt = `
You are StrategicMind AI Scenario Simulator.

SCENARIO INPUT:
${scenario}

TASK:
Generate structured outcomes across:
- bestCase (2–3 sentences)
- mostLikely (2–3 sentences)
- worstCase (2–3 sentences)
- economicImpact (2–3 sentences)
- riskScore (integer 0–100)
- summary (1 sentence)

RULES:
- Return ONLY valid JSON.
- Do NOT include markdown fences, code blocks, or extra text.
- Ensure keys match exactly: bestCase, mostLikely, worstCase, economicImpact, riskScore, summary.
- Keep language concise, briefing‑style.
`;

      const result = await model.generateContent(prompt);
      let text = result?.response?.text?.();

      if (!text) {
        return { result: null, error: "Empty response from Gemini." };
      }
      // Remove markdown fences if present
      text = text
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();
      const parsed = JSON.parse(text); // Expect Gemini to return JSON
      return { result: parsed, error: null };
    } catch (err) {
      console.error("[Scenario Gemini Error]", err);
      return { result: null, error: getFriendlyGeminiError(err) };
    }
  });

export const analyzeArticle = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ArticleInputSchema.parse(input))
  .handler(
    async ({
      data,
    }): Promise<{
      result: ArticleAnalysis | null;
      error: string | null;
      errorCode?: AIErrorCode;
    }> => {
      const result = generateLocalArticleAnalysis({
        title: data.title,
        summary: data.summary,
      });

      return { result, error: null };
    },
  );
