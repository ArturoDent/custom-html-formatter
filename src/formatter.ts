import type { Parse5Node } from "./parser";
import { isElement, isDoctype } from "./parser";
import type {IndentRules} from "./rules";
// import { recordRuleImpact, ruleImpacts, clearRuleImpacts, type RuleImpact } from "./ruleImpact";


interface SourceLocation {
  startLine: number;
  endLine: number;
  endTag?: { startLine: number };
}

type ElementWithLocation = Parse5Node & {
  tagName: string;
  childNodes?: Parse5Node[];
  sourceCodeLocation?: SourceLocation;
};

// export interface FormatResult {
//   text: string;
//   ruleImpacts: RuleImpact[];
// }

export function formatHtmlDocument(text: string, rules: IndentRules): string {
// export function formatHtmlDocument(text: string, rules: IndentRules): FormatResult {
  // clearRuleImpacts();
  
  const lines = splitLines(text);
  const indentUnit = " ".repeat(rules.indentSize ?? 2);

  const indentByLine = new Map<number, string>();

  const doc = parseHtmlWithLocations(text);

  for (const node of doc.childNodes ?? []) {
    collectIndentation(node, null, 0, rules, indentUnit, indentByLine);
  }

  for (let i = 0; i < lines.length; i++) {
    const lineNo = i + 1;
    const indent = indentByLine.get(lineNo);
    if (indent === undefined) continue;

    // Preserve blank lines
    if (/^[ \t]*$/.test(lines[i])) continue;

    lines[i] = lines[i].replace(/^[ \t]*/, indent);
  }

  return lines.join("\n");
  // return {
  //   text: lines.join("\n"),
  //   ruleImpacts: [...ruleImpacts]
  // };
}

function parseHtmlWithLocations(text: string): any {
  const parse5 = require("parse5") as typeof import("parse5");
  return parse5.parse(text, { sourceCodeLocationInfo: true });
}

function collectIndentation(
  node: Parse5Node,
  parent: ElementWithLocation | null,
  depth: number,
  rules: IndentRules,
  indentUnit: string,
  indentByLine: Map<number, string>
): void {
  if (isDoctype(node)) return;
  if (!isElement(node)) return;

  const el = node as ElementWithLocation;
  const loc = el.sourceCodeLocation;
  if (!loc) return;

  const isDirectChildOfNoIndent =
    parent && rules.noIndentUnder.includes(parent.tagName);

  // const effectiveDepth = isDirectChildOfNoIndent ? 0 : depth;
  const effectiveDepth = isDirectChildOfNoIndent ? 0 : depth;

//   if (isDirectChildOfNoIndent && parent) {
//     const delta = (effectiveDepth - depth) * indentUnit.length;

//     recordRuleImpact(
//       `noIndentUnder(${parent.tagName})`,
//       delta,
//       loc.startLine
//     );
//   }
  
  // handle end tags
//   if (loc.endTag?.startLine && isDirectChildOfNoIndent && parent) {
//   recordRuleImpact(
//     `noIndentUnder(${parent.tagName})`,
//     delta,
//     loc.endTag.startLine
//   );
// }


  indentByLine.set(loc.startLine, indentUnit.repeat(effectiveDepth));

  if (loc.endTag?.startLine) {
    indentByLine.set(loc.endTag.startLine, indentUnit.repeat(effectiveDepth));
  }

  const childDepth = rules.noIndentUnder.includes(el.tagName)
    ? 0
    : effectiveDepth + 1;

  for (const child of el.childNodes ?? []) {
    collectIndentation(
      child,
      el,
      childDepth,
      rules,
      indentUnit,
      indentByLine
    );
  }
}

function splitLines(text: string): string[] {
  return text.replace(/\r\n/g, "\n").split("\n");
}
