import * as vscode from "vscode";
import { getLastFormatterState } from "../state/formatterState";

export const formatterDiagnostics =
  vscode.languages.createDiagnosticCollection( "custom-html-formatter" );

/**
 * Diagnostic codes emitted by the Custom HTML Formatter.
 */
export const DiagnosticCodes = {
  NoDefaultFormatter: "noDefaultFormatter",
  NoRulesConfigured: "noRulesConfigured",
  NoIndentUnderMissing: "noIndentUnderMissing"

  // Reserved for future rule-level diagnostics.
  // Currently rule impacts are surfaced via formatter health instead.
  // RuleImpact: "ruleImpact"
} as const;


/**
 * Since ALL diagnostics are caused by settings/formatter state
 * compute them once for all html files.
 * 
 * Diagnostics are intentionally conservative:
 * - emitted only when formatting is broken or impossible
 * - never used for informational or advisory state
 */
export function computeFormatterDiagnostics(): vscode.Diagnostic[] {

  const state = getLastFormatterState();
  const diagnostics: vscode.Diagnostic[] = [];

  // No formatter is configured for HTML at all.
  if ( state === "noFormatter" ) {
    const diag = new vscode.Diagnostic(
      new vscode.Range( 0, 0, 0, 0 ),
      "No default formatter is configured for HTML files.",
      vscode.DiagnosticSeverity.Warning
    );
    diag.code = DiagnosticCodes.NoDefaultFormatter;
    diag.source = "Custom HTML Formatter";
    diagnostics.push( diag );
  }

  // The custom formatter is selected, but has no rules.
  // Formatting will run but produce no changes.
  else if ( state === "activeNoRules" ) {
    const diag = new vscode.Diagnostic(
      new vscode.Range( 0, 0, 0, 0 ),
      "Custom HTML Formatter is selected, but no rules are configured.",
      vscode.DiagnosticSeverity.Warning
    );
    diag.code = DiagnosticCodes.NoRulesConfigured;
    diag.source = "Custom HTML Formatter";
    diagnostics.push( diag );
  }

  // The custom formatter is selected, but has no rules.
  // Formatting will run but produce no changes.
  else if ( state === "activeNoIndentUnder" ) {
    const diag = new vscode.Diagnostic(
      new vscode.Range( 0, 0, 0, 0 ),
      "Custom HTML Formatter is selected, but rule.noIndentUnder is missing.",
      vscode.DiagnosticSeverity.Warning
    );
    diag.code = DiagnosticCodes.NoIndentUnderMissing;
    diag.source = "Custom HTML Formatter";
    diagnostics.push( diag );
  }

  return diagnostics;
}


/**
 * Updates formatter diagnostics for all open html files.
 */
export function updateAllHtmlDiagnostics( diagnostics: vscode.Diagnostic[] ) {

  for ( const doc of vscode.workspace.textDocuments ) {
    if ( doc.languageId === "html" ) {
      formatterDiagnostics.set( doc.uri, diagnostics );
    }
  }
}

