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

  /**
   * Provides quick-fix actions for formatter-related diagnostics.
   *
   * Actions are derived solely from diagnostic codes, not from
   * document content or formatter state.
   */
  provideCodeActions( document: vscode.TextDocument, range: vscode.Range, context: vscode.CodeActionContext ): vscode.CodeAction[] {

    const actions: vscode.CodeAction[] = [];

    for ( const diag of context.diagnostics ) {
      switch ( diag.code ) {
        // No default formatter is configured for HTML.
        // Offer explicit formatter selection or restoration.
        case DiagnosticCodes.NoDefaultFormatter:
          actions.push( this.chooseFormatterAction() );
          actions.push( this.restoreBuiltinAction() );
          break;

        // Custom formatter is selected but has no rules.
        // Offer to enable defaults or revert to built-in behavior.
        case DiagnosticCodes.NoRulesConfigured:
          actions.push( this.enableDefaultsAction( true ) );
          actions.push( this.restoreBuiltinAction() );
          break;

        // Custom formatter is selected but has no rule.noIndentUnder.
        // Offer to enable defaults or revert to built-in behavior.
        case DiagnosticCodes.NoIndentUnderMissing:
          actions.push( this.enableDefaultsAction( true ) );
          actions.push( this.restoreBuiltinAction() );
          break;


        // case DiagnosticCodes.BuiltIn:
        //   // switch to Custom HTML Formatter
        //   actions.push(this.enableDefaultsAction());
        //   // choose a formatter from vscode pop-up
        //   // actions.push(this.chooseFormatterAction());
        //   break;
      }
    }

    return actions;
  }

  /**
   * Opens VS Code's formatter selection UI for HTML documents.
   */
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

  /**
   * Enables the custom formatter with a minimal default rule set.
   * This is an explicit opt-in action initiated by the user.
   */
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

  /**
   * Restores VS Code's built-in HTML formatter explicitly.
   */
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
