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

  const recordedTagImpacts = new Set<string>(); // per run

  const lines = splitLines( text );
  const indentUnit = " ".repeat( rules.indentSize ?? 2 );

  // Maps line numbers to their computed indentation.
  const indentByLine = new Map<number, string>();

  const doc = parseHtmlWithLocations( text );

  // Walk the parse tree and compute indentation per line.
  for ( const node of doc.childNodes ?? [] ) {
    collectIndentation( node, null, 0, rules, indentUnit, indentByLine, recordedTagImpacts );
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
 * - The parse tree defines structural hierarchy.
 * - Visual depth defines how indentation should appear.
 *
 * Structural depth is implicit in the tree and used only for traversal.
 * Visual depth is tracked explicitly and used for formatting.
 *
 * Visual depth normally increases by one per level,
 * but may be suppressed or reset by visual-root rules
 * (e.g. <html>, noIndentUnder(...)).
 *
 * Recursion follows the parse tree.
 * Formatting uses visual depth.
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
  visualDepth: number,
  rules: FormatterRules,
  indentUnit: string,
  indentByLine: Map<number, string>,
  recordedTagImpacts: Set<string>
): void {

  if ( isDoctype( node ) ) return;
  if ( !isElement( node ) ) return;

  const editor = vscode.window.activeTextEditor;
  if ( !editor ) return;
  const document = editor.document;

  const el = node as ElementWithLocation;
  const loc = el.sourceCodeLocation;
  if ( !loc ) return;

  const indent = indentUnit.repeat( visualDepth );

  function isBlankLine( line: number ): boolean {
    return /^[ \t]*$/.test( document.lineAt( line - 1 ).text );
  }

  function indentationChanged( line: number ): boolean {
    if ( isBlankLine( line ) ) return false;
    const existing = getExistingIndent( document, line );
    return existing !== indent;
  }

  // Apply indentation
  indentByLine.set( loc.startLine, indent );
  if ( loc.endTag?.startLine ) {
    indentByLine.set( loc.endTag.startLine, indent );
  }

  // Determine whether a rule applies *here*
  // const ruleTag =
  //   parent?.tagName === "html"
  //     ? "html"
  //     : rules.noIndentUnder.includes( parent?.tagName ?? "" )
  //       ? parent!.tagName
  //       : null;
  const ruleTag =
    rules.noIndentUnder.includes( parent?.tagName ?? "" )
      ? parent!.tagName
      : null;


  // Record rule impact ONCE per element if either tag changed
  if ( ruleTag ) {
    let changed = false;

    if ( indentationChanged( loc.startLine ) ) {
      changed = true;
    }

    if (
      loc.endTag?.startLine &&
      indentationChanged( loc.endTag.startLine )
    ) {
      changed = true;
    }

    if ( changed ) {
      const impactKey = `${ruleTag}:${loc.startLine}`;

      if ( !recordedTagImpacts.has( impactKey ) ) {
        recordedTagImpacts.add( impactKey );

        const delta =
          indent.length -
          indentUnit.repeat( visualDepth + 1 ).length;

        recordRuleImpact(
          document.fileName,
          `noIndentUnder(${ruleTag})`,
          delta,
          loc.startLine
        );
      }
    }
  }

  // Compute child visual depth
  let childVisualDepth = visualDepth + 1;

  // // <html> is structural-only
  // if ( el.tagName === "html" ) {
  //   childVisualDepth = visualDepth;
  // }

  // noIndentUnder creates a visual root (e.g. <body>)
  if ( rules.noIndentUnder.includes( el.tagName ) ) {
    childVisualDepth = 0;
  }

  // Recurse
  for ( const child of el.childNodes ?? [] ) {
    collectIndentation(
      child,
      el,
      childVisualDepth,
      rules,
      indentUnit,
      indentByLine,
      recordedTagImpacts
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
 * Splits text into lines while normalizing line endings.
 */
function splitLines( text: string ): string[] {
  return text.replace( /\r\n/g, "\n" ).split( "\n" );
}
