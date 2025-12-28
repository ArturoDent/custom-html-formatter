import * as parse5 from "parse5";

/**
 * parse5 returns a WHATWG-style DOM tree.
 * We intentionally avoid importing internal tree adapter types.
 */

export type Parse5Node = any;

export function parseHtml(text: string): Parse5Node {
  return parse5.parse(text, {
    sourceCodeLocationInfo: false
  });
}

export function isElement(node: Parse5Node): boolean {
  return typeof node?.tagName === "string";
}

export function isText(node: Parse5Node): boolean {
  return node?.nodeName === "#text";
}

export function isDoctype(node: Parse5Node): boolean {
  return node?.nodeName === "#documentType";
}
