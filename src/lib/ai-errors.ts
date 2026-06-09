/**
 * Centralized AI/API error handling.
 * Never expose raw provider errors, stack traces, or JSON to the user.
 * Always log technical details to the browser console for debugging.
 */

export type AIErrorCode =
  | "RATE_LIMIT"
  | "OVERLOADED"
  | "INTERNAL"
  | "NETWORK"
  | "TIMEOUT"
  | "UNAUTHORIZED"
  | "UNKNOWN";

export interface AIError {
  code: AIErrorCode;
  message: string;
}

const ERROR_MESSAGES: Record<AIErrorCode, string> = {
  RATE_LIMIT: "AI analysis temporarily unavailable due to quota limits. Please try again later.",
  OVERLOADED: "AI service is experiencing unusually high demand. Please try again shortly.",
  INTERNAL: "Internal intelligence service error.",
  NETWORK: "Unable to reach intelligence service. Check your connection.",
  TIMEOUT: "Analysis request timed out. Please retry.",
  UNAUTHORIZED: "Intelligence service authentication failed.",
  UNKNOWN: "Intelligence engine temporarily unavailable.",
};

export function classifyAIError(input: unknown): AIErrorCode {
  const raw =
    input instanceof Error
      ? `${input.name} ${input.message}`
      : typeof input === "string"
        ? input
        : input && typeof input === "object"
          ? JSON.stringify(input)
          : String(input ?? "");

  const s = raw.toLowerCase();

  if (input instanceof Error && input.name === "AbortError") return "TIMEOUT";
  if (/\b429\b|rate.?limit|quota|resource exhausted|too many requests/.test(s)) return "RATE_LIMIT";
  if (/\b503\b|overload|unavailable|service unavailable/.test(s)) return "OVERLOADED";
  if (/\b500\b|internal server|internal error/.test(s)) return "INTERNAL";
  if (/timeout|timed out|deadline/.test(s)) return "TIMEOUT";
  if (/\b401\b|\b403\b|unauthorized|forbidden|api.?key/.test(s)) return "UNAUTHORIZED";
  if (/network|failed to fetch|fetch failed|enotfound|econnreset|offline/.test(s)) return "NETWORK";
  return "UNKNOWN";
}

/**
 * Convert any AI error / response into a clean, user-facing message.
 * Logs the raw technical detail to console only.
 */
export function toAIError(input: unknown, context = "AI"): AIError {
  const code = classifyAIError(input);
  // Log the technical detail privately — never surface to UI.
  console.error(`[${context}] ${code}:`, input);
  return { code, message: ERROR_MESSAGES[code] };
}

export function aiErrorMessage(code: AIErrorCode): string {
  return ERROR_MESSAGES[code];
}
