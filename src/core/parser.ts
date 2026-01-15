import * as parse5 from "parse5";

export type Parse5Node = any;

/**
 * Parses HTML into a parse5 document tree.
 *
 * Source code locations are disabled here because this parser
 * is used only for structural inspection, not formatting.
 */
export function parseHtml( text: string ): Parse5Node {
  return parse5.parse( text, {
    sourceCodeLocationInfo: false
  } );
}

/**
 * Returns true if the node represents an HTML element.
 */
export function isElement( node: Parse5Node ): boolean {
  return typeof node?.tagName === "string";
}

/**
 * Returns true if the node represents a text node.
 */
export function isText( node: Parse5Node ): boolean {
  return node?.nodeName === "#text";
}

/**
 * Returns true if the node represents a document type declaration.
 */
export function isDoctype( node: Parse5Node ): boolean {
  return node?.nodeName === "#documentType";
}
