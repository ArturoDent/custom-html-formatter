import * as assert from "assert";
import { DiagnosticCodes, getStateDiagnostics } from "../../../src/ui/diagnostics";
import { FormatterState } from '../../../src/state/formatterState';

suite( "diagnosticsForState()", () => {
  // test( "noFormatter → NoDefaultFormatter", () => {
  //   // const diags = getStateDiagnostics( "noFormatter" );
  //   const diags = getStateDiagnostics( "customFormatterEnabledJsBeautifyDisabled" );
  //   assert.deepStrictEqual( diags, [
  //     {
  //       code: DiagnosticCodes.JsBeautifyDisabled,
  //       message: "The Custom HTML Formatter is enabled but js-beautify is disabled."
  //     }
  //   ] );
  // } );

  test( "activeNoRules → NoRulesConfigured", () => {
    const diags = getStateDiagnostics( "activeNoRules" );
    assert.deepStrictEqual( diags, [
      {
        code: DiagnosticCodes.NoRulesConfigured,
        message: "Custom HTML Formatter is enabled, but no rules are configured."
      }
    ] );
  } );

  test( "activeNoIndentUnder → NoIndentUnderMissing", () => {
    const diags = getStateDiagnostics( "activeNoIndentUnder" );
    assert.deepStrictEqual( diags, [
      {
        code: DiagnosticCodes.NoIndentUnderMissing,
        message: "Custom HTML Formatter is enabled, but rule.noIndentUnder is missing."
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