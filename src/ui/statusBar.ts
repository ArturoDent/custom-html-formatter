// statusBar.ts
import * as vscode from "vscode";
import { getLastFormatterState } from "../state/formatterState";

export const formatterStatusBar =
  vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    500
  );

formatterStatusBar.command = "customHtmlFormatter.statusClick";

export function showFormatterStatusBar() {
  formatterStatusBar.show();
}

export function hideFormatterStatusBar() {
  formatterStatusBar.show();
}


/**
 * Updates the formatter status bar item.
 * The status bar shows formatter state for html files.
 */
// export async function updateformatterStatusBar( formatterStatusBar: vscode.StatusBarItem ) {
export async function updateFormatterStatusBar() {

  const state = getLastFormatterState();
  if ( !state ) return;

  switch ( state ) {
    // Custom formatter is selected and has rules configured.
    case "activeRules":
      formatterStatusBar.text = "$(pass-filled) Custom Formatter enabled";
      formatterStatusBar.color = new vscode.ThemeColor(
        "statusBarItem.prominentForeground"
      );
      formatterStatusBar.backgroundColor = new vscode.ThemeColor(
        "statusBarItem.prominentBackground"
      );
      formatterStatusBar.tooltip = "Custom HTML Formatter is active";
      formatterStatusBar.show();
      break;

    // Custom formatter is selected but has no rules.
    // Formatting will run but produce no changes.
    case "activeNoRules":
      formatterStatusBar.text = "$(error) Custom Formatter: No rules";
      formatterStatusBar.color = new vscode.ThemeColor(
        "statusBarItem.errorForeground"
      );
      formatterStatusBar.backgroundColor = new vscode.ThemeColor(
        "statusBarItem.errorBackground"
      );
      formatterStatusBar.tooltip = "Click to configure formatter rules";

      formatterStatusBar.show();
      break;

    // Custom formatter is selected but has no rule.noIndentUnder.
    // Formatting will run but produce no changes.
    case "activeNoIndentUnder":
      formatterStatusBar.text = "$(error) Custom Formatter: no noIndentUnder";
      formatterStatusBar.color = new vscode.ThemeColor(
        "statusBarItem.errorForeground"
      );
      formatterStatusBar.backgroundColor = new vscode.ThemeColor(
        "statusBarItem.errorBackground"
      );
      formatterStatusBar.tooltip = "Missing noIndentUnder rule. Click to configure formatter rules";

      formatterStatusBar.show();
      break;

    // VS Code's built-in formatter will be used.
    case "jsBeautifyEnabledNotDefault":
      formatterStatusBar.text = "js-beautify disabled";
      formatterStatusBar.color = undefined;
      formatterStatusBar.backgroundColor = undefined;
      formatterStatusBar.tooltip =
        "Using VS Code's built-in HTML formatter";
      formatterStatusBar.show();
      break;

    // VS Code's built-in formatter will be used.
    case "builtin":
      formatterStatusBar.text = "Built-in Formatter enabled";
      formatterStatusBar.color = undefined;
      formatterStatusBar.backgroundColor = undefined;
      formatterStatusBar.tooltip =
        "Using VS Code's built-in HTML formatter";
      formatterStatusBar.show();
      break;

    case "customFormatterEnabledJsBeautifyDisabled":
      formatterStatusBar.text = "js-beautify disabled";
      formatterStatusBar.color = undefined;
      formatterStatusBar.backgroundColor = undefined;
      formatterStatusBar.tooltip =
        "Using VS Code's built-in HTML formatter";
      formatterStatusBar.show();
      break;

    // No formatter is configured for HTML at all.
    // This is a broken state and warrants a gentle prompt.
    // case "noFormatter":
    case "customFormatterEnabledNotDefault":   //  ****
      //   formatterStatusBar.text = "$(error) Custom Formatter disabled";
      //   formatterStatusBar.color = new vscode.ThemeColor(
      //     "statusBarItem.errorForeground"
      //   );
      //   formatterStatusBar.backgroundColor = new vscode.ThemeColor(
      //     "statusBarItem.errorBackground"
      //   );
      //   formatterStatusBar.tooltip =
      //     "Click to select a formatter";
      //   formatterStatusBar.show();

      break;

    // Non-HTML editors or unsupported contexts.
    default:
      formatterStatusBar.hide();
      const _exhaustive: never = state;
      return _exhaustive;
  }
}