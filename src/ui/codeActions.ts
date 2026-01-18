import * as vscode from "vscode";
import { DiagnosticCodes } from "./diagnostics";

/**
 * Code actions for the Custom HTML Formatter.
 */
export class FormatterCodeActionProvider
  implements vscode.CodeActionProvider {

  static readonly providedCodeActionKinds = [
    vscode.CodeActionKind.QuickFix
  ];

  provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range,
    context: vscode.CodeActionContext
  ): vscode.CodeAction[] {

    const actions: vscode.CodeAction[] = [];

    for ( const diag of context.diagnostics ) {
      switch ( diag.code ) {

        case DiagnosticCodes.NoDefaultFormatter:
          actions.push( this.chooseFormatterAction() );
          actions.push( this.restoreBuiltinAction() );
          break;

        case DiagnosticCodes.NoRulesConfigured:
        case DiagnosticCodes.NoIndentUnderMissing:
          actions.push( this.enableDefaultsAction( true ) );
          actions.push( this.restoreBuiltinAction() );
          break;
      }
    }

    return actions;
  }

  private chooseFormatterAction() {
    const action = new vscode.CodeAction(
      "Choose HTML formatter…",
      vscode.CodeActionKind.QuickFix
    );
    action.command = {
      command: "customHtmlFormatter._internal.chooseFormatter",
      title: "Choose Formatter"
    };
    return action;
  }

  private enableDefaultsAction( noRules: boolean = true ) {
    const action = new vscode.CodeAction(
      "Enable Custom Formatter (defaults)",
      vscode.CodeActionKind.QuickFix
    );
    action.command = {
      command: "customHtmlFormatter.enableWithDefaults",
      arguments: [noRules],
      title: "Enable Formatter"
    };
    return action;
  }

  private restoreBuiltinAction() {
    const action = new vscode.CodeAction(
      "Restore built-in HTML formatter",
      vscode.CodeActionKind.QuickFix
    );
    action.command = {
      command: "customHtmlFormatter.restoreBuiltinHtmlFormatter",
      title: "Restore Built-in"
    };
    return action;
  }
}

/**
 * Registers the formatter code actions for HTML documents.
 *
 * Returns a Disposable that must be added to extension subscriptions.
 */
export function registerFormatterCodeActions(): vscode.Disposable {
  return vscode.languages.registerCodeActionsProvider(
    "html",
    new FormatterCodeActionProvider(),
    {
      providedCodeActionKinds:
        FormatterCodeActionProvider.providedCodeActionKinds
    }
  );
}
