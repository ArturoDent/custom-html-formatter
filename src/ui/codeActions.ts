import * as vscode from "vscode";
import { DiagnosticCodes } from "./diagnostics";

export interface SimpleAction {
  title: string;
  command: string;
  arguments?: any[];
}


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

    // for ( const diag of context.diagnostics ) {
    //   switch ( diag.code ) {

    //     case DiagnosticCodes.NoDefaultFormatter:
    //       actions.push( this.chooseFormatterAction() );
    //       actions.push( this.restoreBuiltinAction() );
    //       break;

    //     case DiagnosticCodes.NoRulesConfigured:
    //     case DiagnosticCodes.NoIndentUnderMissing:
    //       actions.push( this.enableDefaultsAction( true ) );
    //       actions.push( this.restoreBuiltinAction() );
    //       break;
    //   }
    // }

    // return actions;

    for ( const diag of context.diagnostics ) {
      const simpleActions = makeCodeActions( diag.code as string );

      for ( const a of simpleActions ) {
        const action = new vscode.CodeAction( a.title, vscode.CodeActionKind.QuickFix );
        action.command = {
          command: a.command,
          title: a.title,
          arguments: a.arguments
        };
        actions.push( action );
      }
    }
    return actions;
  }
}

export function makeCodeActions( code: string ): SimpleAction[] {

  switch ( code ) {

    case DiagnosticCodes.CustomFormatterEnabledNotDefault:
      return [
        {
          title: "Set Custom Formatter to `defaultFormatter` (Custom Formatter is already enabled)",
          command: "customHtmlFormatter.setDefaultHtmlFormatter",
          arguments: ["ArturoDent.custom-html-formatter"]
        },
        // {
        //   title: "Restore built-in HTML formatter",
        //   command: "customHtmlFormatter.restoreBuiltinHtmlFormatter"
        // }
      ];

    case DiagnosticCodes.JsBeautifyEnabledNotDefault:
      return [
        {
          title: "Set Custom Formatter to `defaultFormatter` (js-beautify is already  enabled)",
          // command: "customHtmlFormatter._internal.chooseFormatter"
          command: "customHtmlFormatter.enableAllWithDefaults",
          arguments: ["ArturoDent.custom-html-formatter"]
        },
        // {
        //   title: "Restore built-in HTML formatter",
        //   command: "customHtmlFormatter.restoreBuiltinHtmlFormatter"
        // }
      ];

    case DiagnosticCodes.CustomFormatterEnabledJsBeautifyDisabled:
      return [
        {
          title: "Enable js-beautify (Custom Formatter is enabled)",
          // command: "customHtmlFormatter._internal.chooseFormatter"
          command: "customHtmlFormatter.enableJsBeautifyOnly"
        },
        {
          title: "Restore built-in HTML formatter",
          command: "customHtmlFormatter.restoreBuiltinHtmlFormatter"
        }
      ];

    case DiagnosticCodes.NoRulesConfigured:
    case DiagnosticCodes.NoIndentUnderMissing:
      return [
        {
          title: "Enable Custom Formatter's default rules",
          command: "customHtmlFormatter.enableAllWithDefaults",
          arguments: [true]
        },
        {
          title: "Restore built-in HTML formatter",
          command: "customHtmlFormatter.restoreBuiltinHtmlFormatter"
        }
      ];

    default:
      return [];
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
