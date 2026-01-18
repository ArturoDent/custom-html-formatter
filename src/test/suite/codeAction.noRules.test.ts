import * as assert from "node:assert";
import * as vscode from "vscode";
import { FormatterCodeActionProvider } from "../../ui/codeActions";
import { DiagnosticCodes } from "../../ui/diagnostics";

suite( "FormatterCodeActionProvider", () => {

  test( "NoRulesConfigured produces enable + restore actions", () => {

    const provider = new FormatterCodeActionProvider();

    const actions = provider.provideCodeActions(
      {} as vscode.TextDocument,   // unused
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
