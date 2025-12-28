export interface IndentRules {
  noIndentUnder: string[];
  indentSize: number;
  preserveBlankLines: boolean;
}

export function loadRulesFromConfig(raw: any): IndentRules {
  const defaults: IndentRules = {
    noIndentUnder: ["body"],
    indentSize: 2,
    preserveBlankLines: true
  };

  if (!raw || typeof raw !== "object") return defaults;

  return {
    noIndentUnder: Array.isArray(raw.noIndentUnder) ? raw.noIndentUnder.map(String) : defaults.noIndentUnder,
    indentSize: typeof raw.indentSize === "number" ? raw.indentSize : defaults.indentSize,
    preserveBlankLines: typeof raw.preserveBlankLines === "boolean" ? raw.preserveBlankLines : defaults.preserveBlankLines
  };
}

/**
 * Minimal selector support:
 * - "tag"
 * - "tag.class" / "tag#id" are parsed but only the tag part is matched (fast + safe default).
 */
export function parentMatchesSelector(parentTagName: string, selector: string): boolean {
  const tagPart = selector.split(/[#.]/)[0]?.trim();
  if (!tagPart) return false;
  return tagPart.toLowerCase() === parentTagName.toLowerCase();
}
