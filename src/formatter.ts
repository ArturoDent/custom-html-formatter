import type {Parse5Node} from "./parser";

import {parseHtml, isElement, isText, isDoctype} from "./parser";
import type {IndentRules} from "./rules";
import {parentMatchesSelector} from "./rules";

interface Parse5Attribute {
  name: string;
  value: string;
}


export function formatHtmlDocument(text: string, rules: IndentRules): string {
  const doc = parseHtml(text);
  const indentUnit = " ".repeat(Math.max(0, rules.indentSize || 2));

  let out = "";
  for (const node of doc.childNodes) {
    out += formatNode(node, null, rules, 0, indentUnit);
  }

  return out.replace(/\s*$/, "") + "\n";
}

function shouldIndent(parent: Parse5Node | null, rules: IndentRules): boolean {
  if (!parent) return false;

  for (const selector of rules.noIndentUnder) {
    if (parentMatchesSelector(parent.tagName, selector)) {
      return false;
    }
  }
  return true;
}

function formatAttributes(attrs: Parse5Node["attrs"]): string {
  if (!attrs || !attrs.length) return "";

  return (
    " " +
    attrs
      .map((a: Parse5Attribute) => `${a.name}="${a.value}"`)
      .join(" ")
  );
}

function formatNode(
  node: Parse5Node,
  parent: Parse5Node | null,
  rules: IndentRules,
  depth: number,
  indentUnit: string
): string {
  const indentThis = parent ? shouldIndent(parent, rules) : false;
  const indent = indentThis ? indentUnit.repeat(depth) : "";

  // <!DOCTYPE html>
  if (isDoctype(node)) {
    return "<!DOCTYPE html>\n";
  }

  // Text node
  if (isText(node)) {
    // const text = node.value;
    const text: string = node.value;

    if (!text.trim()) {
      return rules.preserveBlankLines ? "\n" : "";
    }

    return text
      .split(/\r?\n/)
      .map((l: string) => l.trim())
      .filter((l: string) => l.length > 0)
      .map((l: string) => indent + l + "\n")
      .join("");

  }

  // Element node
  if (isElement(node)) {
    const tag = node.tagName;
    const attrs = formatAttributes(node.attrs);
    const children = node.childNodes ?? [];

    let out = `${indent}<${tag}${attrs}>`;

    if (!children.length) {
      return out + `</${tag}>\n`;
    }

    // Inline text optimization
    const meaningful = children.filter((c: Parse5Node) =>
      isText(c) ? c.value.trim().length > 0 : true
    );

    if (
      meaningful.length === 1 &&
      isText(meaningful[0])
    ) {
      return (
        out +
        meaningful[0].value.trim() +
        `</${tag}>\n`
      );
    }

    out += "\n";

    const indentChildren = shouldIndent(node, rules);
    const childDepth = indentChildren ? depth + 1 : depth;

    for (const child of children) {
      out += formatNode(child, node, rules, childDepth, indentUnit);
    }

    out += `${indent}</${tag}>\n`;
    return out;
  }

  return "";
}
