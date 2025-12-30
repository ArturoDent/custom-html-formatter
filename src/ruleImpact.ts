export interface RuleImpact {
  rule: string;
  delta: number;
  line: number;
}

export const ruleImpacts: RuleImpact[] = [];

/**
 * Record a single indentation change caused by a formatter rule.
 *
 * @param rule - Human‑readable rule identifier (e.g. "noIndentUnder(body)")
 * @param delta - Indentation delta in spaces (positive or negative)
 * @param line - 1‑based line number where the change occurred
 */
export function recordRuleImpact(
  rule: string,
  delta: number,
  line: number
): void {
  if (delta !== 0) {
    ruleImpacts.push({ rule, delta, line });
  }
}

/**
 * Clear all recorded rule impacts.
 * Call this before each formatter run (e.g. in tests).
 */
export function clearRuleImpacts(): void {
  ruleImpacts.length = 0;
}
