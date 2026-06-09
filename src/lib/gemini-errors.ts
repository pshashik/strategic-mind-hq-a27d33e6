export function getFriendlyGeminiError(error: unknown): string {
  const msg = error instanceof Error ? error.message : String(error);

  if (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED")) {
    return "StrategicMind AI has reached the current AI analysis quota. Please try again in a few minutes.";
  }

  if (msg.includes("503") || msg.includes("UNAVAILABLE")) {
    return "AI analysis service is experiencing unusually high demand. Please retry shortly.";
  }

  if (msg.includes("API_KEY")) {
    return "AI service configuration issue detected.";
  }

  return "Unable to generate intelligence analysis at this time.";
}
