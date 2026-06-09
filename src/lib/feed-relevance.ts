const STOP_WORDS = new Set([
  "what",
  "why",
  "how",
  "when",
  "where",
  "tell",
  "about",
  "latest",
  "current",
  "today",
  "analysis",
  "forecast",
  "impact",
  "risk",
  "issues",
]);

export function calculateFeedRelevance(
  question: string,
  articles: Array<{
    title: string;
    summary?: string;
  }>,
) {
  const feedText = articles
    .map((a) => `${a.title} ${a.summary ?? ""}`)
    .join(" ")
    .toLowerCase();

  const keywords = question
    .toLowerCase()
    .split(/\W+/)
    .filter((w) => w.length > 2)
    .filter((w) => !STOP_WORDS.has(w));

  if (keywords.length === 0) {
    return {
      score: 0,
      mode: "general" as const,
    };
  }

  const matches = keywords.filter((k) => feedText.includes(k));

  const score = matches.length / keywords.length;

  if (score >= 0.5) {
    return {
      score,
      mode: "feed" as const,
    };
  }

  if (score >= 0.2) {
    return {
      score,
      mode: "hybrid" as const,
    };
  }

  return {
    score,
    mode: "general" as const,
  };
}
