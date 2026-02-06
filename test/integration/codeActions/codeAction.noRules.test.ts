import * as assert from "assert";
import * as vscode from "vscode";
import { FormatterCodeActionProvider } from "../../../src/ui/codeActions";
import { DiagnosticCodes } from "../../../src/ui/diagnostics";

suite( "FormatterCodeActionProvider", () => {
  // this.timeout( 0 ); // disable timeout entirely

  test( "NoRulesConfigured produces enable + restore actions", () => {

    const provider = new FormatterCodeActionProvider();

    const actions = provider.provideCodeActions(
      {} as vscode.TextDocument,   // unused so make minimal
      {} as vscode.Range,          // unused
      {
        diagnostics: [
          {
            code: DiagnosticCodes.NoRulesConfigured
          } as vscode.Diagnostic
        ],
        triggerKind: vscode.CodeActionTriggerKind.Automatic,
        only: undefined
      }
    );

    assert.strictEqual( actions.length, 2 );
    assert.strictEqual(
      actions[0].command?.command,
      "customHtmlFormatter.enableWithDefaults"
    );
    assert.strictEqual(
      actions[1].command?.command,
      "customHtmlFormatter.restoreBuiltinHtmlFormatter"
    );
  } );

} );
