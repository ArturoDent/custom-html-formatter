import * as vscode from "vscode";

import { type Parse5Node, isElement, isDoctype } from '../core/parser';
import type { FormatterRules } from './rules';
import {
  recordRuleImpact,
  ruleImpacts as internalRuleImpacts,
  clearRuleImpacts,
  type RuleImpact
} from "../core/ruleImpact";

/**
 * Source location information provided by parse5.
 *
 * Line numbers are 1-based and refer to the original document,
 * allowing indentation to be applied without altering layout.
 */
interface SourceLocation {
  startLine: number;
  endLine: number;
  endTag?: { startLine: number; };
}

/**
 * HTML element node augmented with source location metadata.
 */
type ElementWithLocation = Parse5Node & {
  tagName: string;
  childNodes?: Parse5Node[];
  sourceCodeLocation?: SourceLocation;
};

/**
 * Result of a formatting pass.
 *
 * - `text` preserves all original newlines and non-indentation content
 * - `ruleImpacts` explains *why* indentation changed
 */
export interface FormatResult {
  text: string;
  ruleImpacts: RuleImpact[];
}

/**
 * Computes indentation changes for an HTML document.
 *
 * This function:
 * - preserves all original line breaks
 * - rewrites leading whitespace only
 * - records rule-level impacts for health reporting
 *
 * It does not mutate editor state or apply edits directly.
 */
export function getDocumentChanges(
  text: string,
  rules: FormatterRules
): FormatResult {
  // Clear any previously recorded rule impacts before formatting.
  clearRuleImpacts();

  const lines = splitLines( text );
  const indentUnit = " ".repeat( rules.indentSize ?? 2 );

  // Maps line numbers to their computed indentation.
  const indentByLine = new Map<number, string>();

  const doc = parseHtmlWithLocations( text );

  // Walk the parse tree and compute indentation per line.
  for ( const node of doc.childNodes ?? [] ) {
    collectIndentation( node, null, 0, rules, indentUnit, indentByLine );
  }

  // Apply computed indentation to the original lines.
  for ( let i = 0; i < lines.length; i++ ) {
    const lineNo = i + 1;
    const indent = indentByLine.get( lineNo );
    if ( indent === undefined ) continue;

    // Preserve blank lines exactly as-is.
    if ( /^[ \t]*$/.test( lines[i] ) ) continue;

    lines[i] = lines[i].replace( /^[ \t]*/, indent );
  }

  return {
    text: lines.join( "\n" ),
    ruleImpacts: [...internalRuleImpacts]
  };
}

/**
 * Parses HTML and retains source code location information.
 *
 * Source locations are essential for layout-preserving formatting.
 */
function parseHtmlWithLocations( text: string ): any {
  const parse5 = require( "parse5" ) as typeof import( "parse5" );
  return parse5.parse( text, { sourceCodeLocationInfo: true } );
}

/**
 * Formatting model overview:
 *
 * - Structural depth reflects the parse tree hierarchy.
 * - Effective depth reflects how indentation should appear.
 *
 * Structural depth is used for traversal.
 * Effective depth is used for formatting.
 *
 * Recursion must always follow effective depth.
 */

/**
 * Walks the HTML tree and computes indentation for each element.
 *
 * This function enforces indentation rules while preserving
 * structural relationships between elements.
 */
function collectIndentation(
  node: Parse5Node,
  parent: ElementWithLocation | null,
  structuralDepth: number,
  rules: FormatterRules,
  indentUnit: string,
  indentByLine: Map<number, string>,
  suppressionClaimed: boolean = false // suppression if an ancestor has already impacted
): void {

  const editor = vscode.window.activeTextEditor;
  if ( !editor ) return;
  const document = editor.document;

  if ( isDoctype( node ) ) return;
  if ( !isElement( node ) ) return;

  const el = node as ElementWithLocation;
  const loc = el.sourceCodeLocation;
  if ( !loc ) return;

  const isDirectChildOfNoIndent =
    parent !== null && rules.noIndentUnder.includes( parent.tagName );

  const isNearestNoIndent =
    isDirectChildOfNoIndent && !suppressionClaimed;


  const effectiveDepth = computeEffectiveDepth(
    structuralDepth,
    parent,
    rules
  );

  // If indentation is suppressed by a rule, record the impact.
  if ( isDirectChildOfNoIndent && parent ) {

    const newIndent = indentUnit.repeat( effectiveDepth );
    const existingIndent = getExistingIndent( document, loc.startLine );

    if ( newIndent !== existingIndent ) {
      const delta = newIndent.length - existingIndent.length;

      recordRuleImpact(
        document.fileName,
        `noIndentUnder(${parent.tagName})`,
        delta,
        loc.startLine
      );

      // handle the endTag, which may or may not need its indentation modified
      if (
        loc.endTag?.startLine &&
        loc.endTag.startLine !== loc.startLine
      ) {
        const existingEndIndent = getExistingIndent(
          document,
          loc.endTag.startLine
        );

        if ( newIndent !== existingEndIndent ) {
          const endDelta = newIndent.length - existingEndIndent.length;

          recordRuleImpact(
            document.fileName,
            `noIndentUnder(${parent.tagName})`,
            endDelta,
            loc.endTag.startLine
          );
        }
      }
    }
  }

  // Apply computed indentation to start and end tags.
  indentByLine.set( loc.startLine, indentUnit.repeat( effectiveDepth ) );

  if ( loc.endTag?.startLine ) {
    indentByLine.set(
      loc.endTag.startLine,
      indentUnit.repeat( effectiveDepth )
    );
  }

  // Recurse using *effectiveDepth*, not structuralDepth.
  // Once indentation is suppressed, children must resume indentation
  // relative to the suppressed parent — not the document root.
  for ( const child of el.childNodes ?? [] ) {
    collectIndentation(
      child,
      el,
      effectiveDepth + 1,
      rules,
      indentUnit,
      indentByLine,
      isNearestNoIndent
    );
  }
}

// get the pre-existing indentation on a line - before any changes
function getExistingIndent(
  document: vscode.TextDocument,
  line: number
): string {
  const text = document.lineAt( line - 1 ).text;
  return text.match( /^\s*/ )?.[0] ?? "";
}


/**
 * Computes the effective indentation depth for an element.
 *
 * Rules may override structural depth to suppress indentation
 * under specific parent elements.
 */
function computeEffectiveDepth(
  structuralDepth: number,
  parent: ElementWithLocation | null,
  rules: FormatterRules
): number {
  if ( !parent ) return structuralDepth;

  if ( rules.noIndentUnder.includes( parent.tagName ) ) {
    return 0;
  }

  return structuralDepth;
}

/**
 * Splits text into lines while normalizing line endings.
 */
function splitLines( text: string ): string[] {
  return text.replace( /\r\n/g, "\n" ).split( "\n" );
}
