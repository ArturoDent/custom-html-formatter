import * as vscode from "vscode";
import { getLastFormatterState } from "../state/formatterState";


/**
 * Updates the formatter status bar item.
 * The status bar shows formatter state for html files.
 */
export async function updateformatterSBI( formatterSBI: vscode.StatusBarItem ) {

  const state = getLastFormatterState();

  switch ( state ) {
    // Custom formatter is selected and has rules configured.
    case "activeRules":
      formatterSBI.text = "$(pass-filled) Custom Formatter";
      formatterSBI.color = new vscode.ThemeColor(
        "statusBarItem.prominentForeground"
      );
      formatterSBI.backgroundColor = new vscode.ThemeColor(
        "statusBarItem.prominentBackground"
      );
      formatterSBI.tooltip = "Custom HTML Formatter is active";
      formatterSBI.show();
      break;

    // Custom formatter is selected but has no rules.
    // Formatting will run but produce no changes.
    case "activeNoRules":
      formatterSBI.text = "$(error) Custom Formatter";
      formatterSBI.color = new vscode.ThemeColor(
        "statusBarItem.errorForeground"
      );
      formatterSBI.backgroundColor = new vscode.ThemeColor(
        "statusBarItem.errorBackground"
      );
      formatterSBI.tooltip = "Click to configure formatter rules";

      formatterSBI.show();
      break;

    // Custom formatter is selected but has no rule.noIndentUnder.
    // Formatting will run but produce no changes.
    case "activeNoIndentUnder":
      formatterSBI.text = "$(error) CF: missing rule";
      formatterSBI.color = new vscode.ThemeColor(
        "statusBarItem.errorForeground"
      );
      formatterSBI.backgroundColor = new vscode.ThemeColor(
        "statusBarItem.errorBackground"
      );
      formatterSBI.tooltip = "Missing noIndentUnder rule. Click to configure formatter rules";

      formatterSBI.show();
      break;

    // VS Code's built-in formatter will be used.
    case "builtin":
      formatterSBI.text = "Built-in Formatter";
      formatterSBI.color = undefined;
      formatterSBI.backgroundColor = undefined;
      formatterSBI.tooltip =
        "Using VS Code's built-in HTML formatter";
      formatterSBI.show();
      break;

    // No formatter is configured for HTML at all.
    // This is a broken state and warrants a gentle prompt.
    case "noFormatter":
      formatterSBI.text = "$(error) NO Html Formatter";
      formatterSBI.color = new vscode.ThemeColor(
        "statusBarItem.errorForeground"
      );
      formatterSBI.backgroundColor = new vscode.ThemeColor(
        "statusBarItem.errorBackground"
      );
      formatterSBI.tooltip =
        "Click to select a formatter";
      formatterSBI.show();

      // Prompt is debounced to avoid repeated interruptions.
      // showDebouncedPromptForDefaultFormatter();
      break;

    // Non-HTML editors or unsupported contexts.
    default:
      formatterSBI.hide();
  }
}