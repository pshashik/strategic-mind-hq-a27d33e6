import type { ArticleAnalysis } from "@/lib/intelligence.functions";
import { buildExecutiveSummaryMetrics } from "@/lib/simple-briefing";

interface ArticleLike {
  title: string;
  summary?: string;
}

const RISK_KEYWORDS = [
  { pattern: /\b(war|invasion|airstrike|missile|drone|bombard|clash|shelling)\b/i, weight: 4 },
  { pattern: /\b(nuclear|enrichment|warhead|icbm|uranium)\b/i, weight: 4 },
  { pattern: /\b(sanctions?|embargo|tariff|blockade|trade war)\b/i, weight: 3 },
  { pattern: /\b(protest|unrest|coup|riot|insurgent|rebellion)\b/i, weight: 3 },
  { pattern: /\b(cyber|hack|malware|ransomware)\b/i, weight: 2 },
  { pattern: /\b(ceasefire|negotiat|summit|diplomatic|talks)\b/i, weight: 1 },
];

function clamp10(n: number): number {
  return Math.max(1, Math.min(10, Math.round(n)));
}

function scoreText(text: string): number {
  let score = 2;
  for (const { pattern, weight } of RISK_KEYWORDS) {
    if (pattern.test(text)) score += weight;
  }
  return clamp10(score);
}

/**
 * Local, offline analysis used when the AI service is unavailable.
 * Mirrors the shape returned by `analyzeArticle` so the UI can render
 * a clean intelligence report without leaving the user with a blank state.
 */
export function generateLocalArticleAnalysis(article: ArticleLike): ArticleAnalysis {
  const text = `${article.title} ${article.summary ?? ""}`.trim();
  const metrics = buildExecutiveSummaryMetrics([
    { title: article.title, description: article.summary ?? "" },
  ]);

  const riskScore = scoreText(text);
  const strategicImportance = clamp10(riskScore - 1);

  const country = metrics.mostMentionedCountry;
  const region = metrics.highestRiskRegion;
  const topic = metrics.mostCommonTopic;

  const countries = country && country !== "Multiple countries" ? [country] : [];

  // const executiveSummary =
  //   article.summary?.trim() ||
  //   `${article.title}. Analysis derived locally from the source headline; AI service is temporarily offline.`;
  const executiveSummary =
    article.summary?.trim() ||
    `Current reporting indicates: ${article.title}. This assessment was generated using local intelligence heuristics because the AI analysis service is unavailable.`;

  const politicalImpact =
    riskScore >= 8
      ? `High potential for policy shifts and increased government response activity across ${region}.`
      : `Limited near-term political impact expected, though developments should be monitored.`;

  return {
    executiveSummary,
    countriesInvolved: countries,
    strategicImportance,
    riskScore,
    politicalImpact,
    //politicalImpact: `Potential ${topic} repercussions across ${region}, including shifts in governance posture and alliance signaling.`,
    economicImpact: `Possible market sensitivity in ${region}, with downstream effects on trade, commodities, and capital flows tied to ${country}.`,
    militaryImpact: /military|war|missile|strike|drone|troop|naval/i.test(text)
      ? `Elevated military signaling observed; readiness postures in ${region} may adjust accordingly.`
      : `No direct kinetic indicators; force-posture impact in ${region} expected to be limited.`,
    diplomaticImpact: `Diplomatic channels involving ${country} likely to be tested, with ${region} actors recalibrating engagement.`,
  };
}
