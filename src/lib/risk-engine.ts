import type { RiskLevel } from "@/lib/mock-data";

export function deriveArticleSeverity(title: string, summary?: string): RiskLevel {
  const text = `${title} ${summary ?? ""}`.toLowerCase();

  let score = 0;

  // Critical
  if (/war|invasion|missile|airstrike|nuclear|massacre|atrocity|ballistic|icbm/i.test(text))
    score += 5;

  // High
  if (/attack|strike|drone|troops?|military|conflict|clash|shelling|battle/i.test(text)) score += 3;

  // Medium
  if (/sanctions?|blockade|embargo|protest|instability|tension|tariff/i.test(text)) score += 2;

  // Low
  if (/summit|talks|ceasefire|meeting|agreement|diplomatic/i.test(text)) score += 1;

  if (score >= 5) return "critical";
  if (score >= 3) return "high";
  if (score >= 2) return "medium";

  return "low";
}
