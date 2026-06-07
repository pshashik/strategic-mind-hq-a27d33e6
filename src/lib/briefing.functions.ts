import {
  buildExecutiveSummaryMetrics,
  generateExecutiveSummary,
  type ExecutiveSummaryArticle,
  type ExecutiveSummaryMetrics,
  type ExecutiveSummaryResult,
} from "@/lib/simple-briefing";

export type { ExecutiveSummaryArticle, ExecutiveSummaryMetrics, ExecutiveSummaryResult };

/**
 * Backward-compatible name for the Executive Summary feature.
 * This is now a pure deterministic helper, not a server function.
 */
export function synthesizeExecutiveSummary(
  articles: readonly ExecutiveSummaryArticle[],
): ExecutiveSummaryResult {
  return generateExecutiveSummary(articles);
}

export function summarizeExecutiveSummaryMetrics(
  articles: readonly ExecutiveSummaryArticle[],
): ExecutiveSummaryMetrics {
  return buildExecutiveSummaryMetrics(articles);
}
