import * as vscode from "vscode";

/**
 * Formatter configuration scope.
 *
 * This represents *where* the HTML formatter configuration is defined,
 * not which formatter will run or what it will do.
 */
export type FormatterScopeState =
  | "workspace" // Formatter explicitly set in workspace settings
  | "global"    // Formatter set only in user/global settings
  | "mixed"     // Workspace and global settings both exist and differ
  | "builtin";  // No explicit formatter configured (implicit built-in)

/**
 * Determines the scope of the HTML formatter configuration.
 * Where the [html]: editor.defaultFormatter is actually written.
 * This function inspects VS Code configuration at both the global
 * and workspace levels to explain how formatter selection is resolved.
 */
export function getFormatterScopeState(): FormatterScopeState {
  const cfg = vscode.workspace.getConfiguration();

  const htmlSetting = cfg.inspect( "[html]" );

  const globalValue = htmlSetting?.globalValue as any | undefined;
  const workspaceValue = htmlSetting?.workspaceValue as any | undefined;

  const globalFormatter = globalValue?.["editor.defaultFormatter"];
  const workspaceFormatter = workspaceValue?.["editor.defaultFormatter"];

  // Both global and workspace formatters are set and differ.
  // This can lead to surprising behavior and is surfaced explicitly.
  if (
    globalFormatter &&
    workspaceFormatter &&
    globalFormatter !== workspaceFormatter
  ) {
    return "mixed";  // TODO: do what with this
  }

  // Workspace-level formatter overrides global configuration.
  if ( workspaceFormatter ) {
    return "workspace";
  }

  // Formatter is configured only at the global/user level.
  if ( globalFormatter ) {
    return "global";
  }

  // No formatter explicitly configured → VS Code's implicit built-in behavior.
  return "builtin";
}
