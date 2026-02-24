import * as vscode from "vscode";
import { getLastFormatterState, type FormatterState } from "../state/formatterState";

export interface SimpleDiagnostic {
  code: string;
  message: string;
}

export const formatterDiagnostics =
  vscode.languages.createDiagnosticCollection( "custom-html-formatter" );

// Diagnostic codes emitted by the Custom HTML Formatter.
export const DiagnosticCodes = {
  JsBeautifyEnabledNotDefault: "jsBeautifyEnabledNotDefault",
  CustomFormatterEnabledNotDefault: "customFormatterEnabledNotDefault",
  CustomFormatterEnabledJsBeautifyDisabled: "customFormatterEnabledJsBeautifyDisabled",
  // JsBeautifyDisabled: "jsBeautifyDisabled",
  NoRulesConfigured: "noRulesConfigured",
  NoIndentUnderMissing: "noIndentUnderMissing"
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
  const simple = getStateDiagnostics( state );

  // TODO: what happens here when the state === undefined ?
  return simple.map( s => {
    const diag = new vscode.Diagnostic(
      new vscode.Range( 0, 0, 0, 0 ),
      s.message,
      vscode.DiagnosticSeverity.Warning
    );
    diag.code = s.code;
    diag.source = "Custom HTML Formatter";
    return diag;
  } );
}

// used in tests also
export function getStateDiagnostics( state: FormatterState | undefined ): SimpleDiagnostic[] {

  switch ( state ) {
    case "customFormatterEnabledNotDefault":
      return [
        {
          code: DiagnosticCodes.CustomFormatterEnabledNotDefault,
          message: "The Custom HTML Formatter is enabled but defaultFormatter is not."
        }
      ];


    case "jsBeautifyEnabledNotDefault":
      return [
        {
          code: DiagnosticCodes.JsBeautifyEnabledNotDefault,
          message: "js-beautify is enabled but defaultFormatter is not."
        }
      ];

    case "customFormatterEnabledJsBeautifyDisabled":
      return [
        {
          code: DiagnosticCodes.CustomFormatterEnabledJsBeautifyDisabled,
          message: "Custom HTML Formatter is enabled but js-beautify is disabled."
        }
      ];

    case "activeNoRules":
      return [
        {
          code: DiagnosticCodes.NoRulesConfigured,
          message: "Custom HTML Formatter is enabled, but no rules are configured."
        }
      ];

    case "activeNoIndentUnder":
      return [
        {
          code: DiagnosticCodes.NoIndentUnderMissing,
          message: "Custom HTML Formatter is enabled, but rule.noIndentUnder is missing."
        }
      ];

    default:
      return [];
  }
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

