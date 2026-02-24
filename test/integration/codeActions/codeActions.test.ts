import * as assert from "assert";
import { makeCodeActions } from "../../../src/ui/codeActions";
import { DiagnosticCodes } from "../../../src/ui/diagnostics";

suite( "actionsForDiagnostic()", () => {
  // test( "NoDefaultFormatter → choose + restore", () => {
  //   const actions = makeCodeActions( DiagnosticCodes.JsBeautifyDisabled );

  //   assert.deepStrictEqual( actions, [
  //     {
  //       title: "Enable Custom  HTML Formatter",
  //       command: "customHtmlFormatter._internal.chooseFormatter"
  //     },
  //     {
  //       title: "Restore built-in HTML formatter",
  //       command: "customHtmlFormatter.restoreBuiltinHtmlFormatter"
  //     }
  //   ] );
  // } );

  test( "NoRulesConfigured → enable + restore", () => {
    const actions = makeCodeActions( DiagnosticCodes.NoRulesConfigured );

    assert.deepStrictEqual( actions, [
      {
        title: "Enable Custom Formatter's default rules",
        command: "customHtmlFormatter.enableAllWithDefaults",
        arguments: [true]
      },
      {
        title: "Restore built-in HTML formatter",
        command: "customHtmlFormatter.restoreBuiltinHtmlFormatter"
      }
    ] );
  } );

  test( "Unknown diagnostic → empty", () => {
    const actions = makeCodeActions( "SomethingElse" );
    assert.deepStrictEqual( actions, [] );
  } );
} );