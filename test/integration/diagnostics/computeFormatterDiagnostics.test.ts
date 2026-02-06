import * as assert from "assert";
import { DiagnosticCodes, getStateDiagnostics } from "../../../src/ui/diagnostics";
import { FormatterState } from '../../../src/state/formatterState';

suite( "diagnosticsForState()", () => {
  test( "noFormatter → NoDefaultFormatter", () => {
    const diags = getStateDiagnostics( "noFormatter" );
    assert.deepStrictEqual( diags, [
      {
        code: DiagnosticCodes.NoDefaultFormatter,
        message: "No default formatter is configured for HTML files."
      }
    ] );
  } );

  test( "activeNoRules → NoRulesConfigured", () => {
    const diags = getStateDiagnostics( "activeNoRules" );
    assert.deepStrictEqual( diags, [
      {
        code: DiagnosticCodes.NoRulesConfigured,
        message: "Custom HTML Formatter is selected, but no rules are configured."
      }
    ] );
  } );

  test( "activeNoIndentUnder → NoIndentUnderMissing", () => {
    const diags = getStateDiagnostics( "activeNoIndentUnder" );
    assert.deepStrictEqual( diags, [
      {
        code: DiagnosticCodes.NoIndentUnderMissing,
        message: "Custom HTML Formatter is selected, but rule.noIndentUnder is missing."
      }
    ] );
  } );

  test( "builtin → no diagnostics", () => {
    const diags = getStateDiagnostics( "builtin" );
    assert.deepStrictEqual( diags, [] );  // default
  } );

  test( "invalid state → no diagnostics", () => {
    // 'unknown' needed because "active" is not in FormatterState
    const diags = getStateDiagnostics( "active" as unknown as FormatterState );
    assert.deepStrictEqual( diags, [] );  // default
  } );
} );

// export function computeFormatterDiagnostics(): vscode.Diagnostic[] {

//   const state = getLastFormatterState();
//   const diagnostics: vscode.Diagnostic[] = [];

//   // No formatter is configured for HTML at all.
//   if ( state === "noFormatter" ) {
//     const diag = new vscode.Diagnostic(
//       new vscode.Range( 0, 0, 0, 0 ),
//       "No default formatter is configured for HTML files.",
//       vscode.DiagnosticSeverity.Warning
//     );
//     diag.code = DiagnosticCodes.NoDefaultFormatter;
//     diag.source = "Custom HTML Formatter";
//     diagnostics.push( diag );
//   }

//   // The custom formatter is selected, but has no rules.
//   // Formatting will run but produce no changes.
//   else if ( state === "activeNoRules" ) {
//     const diag = new vscode.Diagnostic(
//       new vscode.Range( 0, 0, 0, 0 ),
//       "Custom HTML Formatter is selected, but no rules are configured.",
//       vscode.DiagnosticSeverity.Warning
//     );
//     diag.code = DiagnosticCodes.NoRulesConfigured;
//     diag.source = "Custom HTML Formatter";
//     diagnostics.push( diag );
//   }

//   // The custom formatter is selected, but has no rules.
//   // Formatting will run but produce no changes.
//   else if ( state === "activeNoIndentUnder" ) {
//     const diag = new vscode.Diagnostic(
//       new vscode.Range( 0, 0, 0, 0 ),
//       "Custom HTML Formatter is selected, but rule.noIndentUnder is missing.",
//       vscode.DiagnosticSeverity.Warning
//     );
//     diag.code = DiagnosticCodes.NoIndentUnderMissing;
//     diag.source = "Custom HTML Formatter";
//     diagnostics.push( diag );
//   }

//   return diagnostics;
// }