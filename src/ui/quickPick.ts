import * as vscode from "vscode";
import { DEFAULT_RULES } from "../core/rules";
import {
  enableAllWithDefaults,
  enableJsBeautifyOnly,
  getCurrentConfigs,
  setDefaultHtmlFormatter,
  updateRules
} from '../core/configs';


export async function showQuickPickOptions() {

  const currentConfigs = getCurrentConfigs();
  const scope = currentConfigs?.scope;

  // TODO: use formatter state to narrow
  // const state = getLastFormatterState();

  const selections = await vscode.window.showQuickPick(
    [
      {
        label: `Enable js-beautify only`,
        shortId: "ENABLE_JS_BEAUTIFY_ONLY",
        formatterId: "ArturoDent.custom-html-formatter"
      },
      {
        label: `Enable js-beautify and Custom HTML Formatter`,
        shortId: "ENABLE_JS_BEAUTIFY_AND_CUSTOM_FORMATTER",
        formatterId: "ArturoDent.custom-html-formatter"
      },
      {
        label: `Enable default Custom Rules`,
        shortId: "RULES",
        formatterId: "ArturoDent.custom-html-formatter"
      },
      {
        label: `Enable VS Code built-in HTML formatter`,
        shortId: "BUILTIN",
        formatterId: "vscode.html-language-features"
      }
    ],
    { placeHolder: "Choose 1 or more options", canPickMany: true }
  );

  if ( !selections || !selections.length ) return;

  const target =
    scope === "workspace"
      ? vscode.ConfigurationTarget.Workspace
      : vscode.ConfigurationTarget.Global;

  for await ( const selection of selections ) {

    switch ( selection.shortId ) {

      case "ENABLE_JS_BEAUTIFY_ONLY":
        if ( currentConfigs?.defaultFormatter !== "ArturoDent.custom-html-formatter" )
          await setDefaultHtmlFormatter( "ArturoDent.custom-html-formatter" );

        await enableJsBeautifyOnly();
        // await vscode.workspace
        //   .getConfiguration()
        //   .update( "customHtmlFormatter.enabled", true, target
        //   );
        // vscode.window.showInformationMessage(
        //   `js-beautify is enabled for ${scope}.`
        // );
        break;

      case "ENABLE_JS_BEAUTIFY_AND_CUSTOM_FORMATTER":
        if ( currentConfigs?.defaultFormatter !== "ArturoDent.custom-html-formatter" )
          await setDefaultHtmlFormatter( "ArturoDent.custom-html-formatter" );
        await enableAllWithDefaults( false );

        // await vscode.workspace
        //   .getConfiguration()
        //   .update( "customHtmlFormatter.enabled", true, target
        //   );
        // vscode.window.showInformationMessage(
        //   `js-beautify and Custom HTML Formatter are enabled for ${scope}.`
        // );
        break;

      case "BUILTIN":
        // await restoreBuiltinHtmlFormatter();
        if ( currentConfigs?.defaultFormatter !== "vscode.html-language-features" )
          await setDefaultHtmlFormatter( "vscode.html-language-features" );
        // vscode.window.showInformationMessage(
        //   `Default formatter set to ${selection.shortId} for ${scope}.`
        // );
        break;

      // if noRules make defaults, else don't change existing rules
      // rules.noIndentUnder, rules.indentSize
      case "RULES":
        if ( currentConfigs?.defaultFormatter !== "ArturoDent.custom-html-formatter" )
          await setDefaultHtmlFormatter( "ArturoDent.custom-html-formatter" );

        // const existingRules = getCurrentConfigs()?.rules;
        const existingRules = currentConfigs?.rules;

        if ( !existingRules || ( !existingRules.noIndentUnder?.length && !existingRules.indentSize ) ) {
          try {
            updateRules( { ...DEFAULT_RULES }, target, false );
            showOpenSettingsPrompt( `Custom Rules enabled for ${scope}.`, target );
          }
          catch ( err ) {
            console.error( "Update failed:", err );
          }
        }
        else if ( existingRules && !existingRules.noIndentUnder?.length ) {
          try {
            updateRules( { noIndentUnder: DEFAULT_RULES.noIndentUnder }, target, false );
            showOpenSettingsPrompt( `Custom Rules.noIndentUnder enabled for ${scope}.`, target );
          }
          catch ( err ) {
            console.error( "Update failed:", err );
          }
        }
        else if ( existingRules && !existingRules.indentSize ) {
          try {
            updateRules( { indentSize: DEFAULT_RULES.indentSize }, target, false );
            showOpenSettingsPrompt( `Custom Rules.indentSize enabled for ${scope}.`, target );
          }
          catch ( err ) {
            console.error( "Update failed:", err );
          }
        }
        else {  // there already are existingRules.noIndentUnder and existingRules.indentSize
          showOpenSettingsPrompt( `Custom Rules were already enabled for ${scope}.`, target );
        }
        break;
    }
  }
}

export async function showOpenSettingsPrompt( message: string, target: vscode.ConfigurationTarget ) {

  const strTarget = target === vscode.ConfigurationTarget.Workspace ? "workspace" : "global";
  const choice = await vscode.window.showInformationMessage(
    message,
    `Open ${strTarget} Settings`,
    `Enable default rules`
  );

  if ( choice === `Open ${strTarget} Settings` ) {

    const settingId = "customHtmlFormatter.rules";
    const encoded = encodeURIComponent( `"${settingId}"` );

    const command =
      target === vscode.ConfigurationTarget.Workspace
        ? "workbench.action.openWorkspaceSettingsFile"
        : "workbench.action.openSettingsJson";

    await vscode.commands.executeCommand(
      command,
      encoded
    );
  }

  else if ( choice === `Enable default rules` ) {
    await vscode.workspace
      .getConfiguration( "customHtmlFormatter" )
      .update( "rules", DEFAULT_RULES, target );
  }
}

// Debounce state to avoid repeatedly prompting the user.
// let promptTimeout: NodeJS.Timeout | undefined;

/**
 * Shows the formatter selection prompt with a debounce window.
 *
 * This prevents repeated prompts during rapid editor or configuration changes
 * while still ensuring the user is informed.
 */
// export async function showDebouncedPromptForDefaultFormatter() {
//   if ( promptTimeout ) {
//     return;
//   }

//   promptTimeout = setTimeout( () => {
//     promptTimeout = undefined;
//   }, 2000 ); // 2 second debounce

//   promptForDefaultFormatter();
// }
