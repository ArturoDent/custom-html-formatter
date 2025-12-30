import type { RuleImpact } from "../../ruleImpact";

export function printRuleSummary(ruleImpacts: RuleImpact[]): void {
  if (!ruleImpacts.length) {
    return;
  }

  const summary = new Map<
    string,
    { total: number; lines: Set<number> }
  >();

  for (const { rule, delta, line } of ruleImpacts) {
    const entry = summary.get(rule) ?? {
      total: 0,
      lines: new Set<number>()
    };

    entry.total += delta;
    entry.lines.add(line);
    summary.set(rule, entry);
  }

  console.log("\n=== RULE IMPACT SUMMARY ===");

  for (const [rule, { total, lines }] of summary) {
    console.log(
      `${rule}: ${total > 0 ? "+" : ""}${total} spaces (${lines.size} line${lines.size === 1 ? "" : "s"})`
    );
  }
}
