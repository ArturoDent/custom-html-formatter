import * as vscode from "vscode";
import { loadRulesFromConfig, DEFAULT_RULES, FormatterRules } from "../core/rules";

type ConfigWriteScope = "global" | "workspace";

//  ----------------------------- current configurations/settings -------------

export type CurrentConfigs = {
  scope: ConfigWriteScope;
  rules: FormatterRules | null;
  formatterState: FormatterState;
  defaultFormatter: any | null;
};

let currentConfigs: CurrentConfigs | undefined;

// can take 1-3 args
// setCurrentConfigs({ scope: "workspace" });
// setCurrentConfigs( { rules: newRules } );
// setCurrentConfigs({ rules: updatedRules, formatter: "active" });
// setCurrentConfigs({ scope: "global", rules: updatedRules, formatter: "builtin" });

export async function setCurrentConfigs( patch: Partial<CurrentConfigs> ) {

  // make sure init has already been called, esp. after clearCurrentConfigs()
  if ( !currentConfigs ) {
    throw new Error(
      "setCurrentConfigs() called before currentConfigs was initialized"
    );
  }
  currentConfigs = { ...currentConfigs, ...patch };
  setLastFormatterState( currentConfigs.formatterState );
}

export function initCurrentConfigs( configs: CurrentConfigs ) {
  currentConfigs = configs;
}
export function getCurrentConfigs() {
  return currentConfigs;
}
export function clearCurrentConfigs() {
  currentConfigs = undefined;
}

export async function computeCurrentConfigs() {

  const scope = await translateScopeToText();
  const defaultFormatter = vscode.workspace.getConfiguration( '', { languageId: "html" } ).get( 'editor.defaultFormatter' );

  let rulesRaw = vscode.workspace.getConfiguration( "customHtmlFormatter" ).get( "rules" );
  let rules = loadRulesFromConfig( rulesRaw ) ?? null;  // can return undefined

  const formatterState = computeFormatterState( defaultFormatter, rules );

  return {
    rules, scope, defaultFormatter, formatterState
  };
}

// ----------------------------------------------------------------------------

/**
 * Formatter state.
 *
 * This module determines which formatter *would* run for the active editor
 * and whether the custom formatter is configured with 'rules'.
 */

export type FormatterState =
  | "activeRules"          // Custom formatter selected and rules are configured
  | "activeNoRules"        // Custom formatter selected but no rules are configured
  | "activeNoIndentUnder"  // Custom formatter selected but no rule.noIndentUnder
  | "builtin"              // VS Code's built-in formatter will run
  | "noFormatter";         // No default formatter is configured for HTML

// Cached formatter state used for UI interactions.
// Updated whenever getFormatterState() is called.
// export let lastFormatterState: FormatterState | undefined;
export let lastFormatterState: FormatterState | undefined;

export function getLastFormatterState(): FormatterState | undefined {
  return lastFormatterState;
}
export function setLastFormatterState( newState: FormatterState ): void {
  lastFormatterState = newState;
}
export function clearLastFormatterState(): void {
  lastFormatterState = undefined;
}

/**
 * Determines the effective formatter state for html files.
 *
 * This function resolves formatter behavior based on:
 * - HTML default formatter configuration
 * - presence of custom formatter rules
 */
export function getFormatterState( configs: any ): FormatterState {

  const state = computeFormatterState( configs.defaultFormatter, configs.rules );
  lastFormatterState = state;
  return state;
}

export function computeFormatterState( defaultFormatter: string | unknown, rules: any ): FormatterState {

  // No default formatter configured for HTML.
  if ( !defaultFormatter ) return "noFormatter";

  // A formatter is configured, but it is not the custom formatter.
  if ( defaultFormatter !== "ArturoDent.custom-html-formatter" ) return "builtin";

  // The formatter is considered active even if it produces no changes.
  // rules could be an empty array or only have indentSize or only noIndentUnder
  // rules: null or noIndentUnder.length === 0 or indentSize always present with default length

  if ( rules && Object.keys( rules ).length === 0 ) return "activeNoRules";

  if ( !rules?.noIndentUnder?.length ) return "activeNoIndentUnder";

  return rules ? "activeRules" : "activeNoRules"; // TODO: another state "unknown"?
}

/**
 * Enables the custom formatter with a default configuration.
 *
 * This is an opt-in action that:
 * - sets default rules at the chosen scope/target
 * - selects the custom formatter for HTML files
 */
export async function enableDefaults( noRules: boolean = true ) {

  const scope = await getConfigWriteScope();

  const target =
    scope === "workspace"
      ? vscode.ConfigurationTarget.Workspace
      : vscode.ConfigurationTarget.Global;

  if ( !noRules )
    await vscode.workspace
      .getConfiguration()
      .update(
        "[html]",
        { "editor.defaultFormatter": "ArturoDent.custom-html-formatter" },
        target
      );

  if ( noRules ) {
    await vscode.workspace
      .getConfiguration( "customHtmlFormatter" )
      .update( "rules", DEFAULT_RULES, target );

    vscode.window.showInformationMessage(
      "Custom HTML Formatter and Rules enabled for this workspace."
    );
  }
}

/**
 * Restores VS Code's built-in HTML formatter explicitly.
 */
export async function restoreBuiltinHtmlFormatter() {

  const scope = await getConfigWriteScope();
  const target =
    scope === "workspace"
      ? vscode.ConfigurationTarget.Workspace
      : vscode.ConfigurationTarget.Global;

  const config = vscode.workspace.getConfiguration();

  await config.update(
    "[html]",
    {
      "editor.defaultFormatter": "vscode.html-language-features"
    },
    target
  );

  vscode.window.showInformationMessage(
    "VS Code's built-in HTML formatter has been restored."
  );
}


export async function showQuickPickOptions() {

  const currentConfigs = getCurrentConfigs();
  const scope = currentConfigs?.scope;

  // TODO: use formatter state to narrow
  // const state = getLastFormatterState();

  const selections = await vscode.window.showQuickPick(
    [
      {
        label: `Enable Custom HTML Formatter`,
        shortId: "CUSTOM",
        formatterId: "ArturoDent.custom-html-formatter"
      },
      {
        label: `Enable  default Custom Rules`,
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

      case "CUSTOM": case "BUILTIN":
        await vscode.workspace.getConfiguration().update(
          "[html]",
          { "editor.defaultFormatter": selection.formatterId },
          target
        );
        vscode.window.showInformationMessage(
          `Default formatter set to ${selection.shortId} for ${scope}.`
        );
        break;

      // if noRules make defaults, else don't change existing rules
      // rules.noIndentUnder, rules.indentSize
      case "RULES":

        const existingRules = getCurrentConfigs()?.rules;

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

async function updateRules( patch: Partial<FormatterRules>, target: vscode.ConfigurationTarget, overWrite: boolean ) {

  const config = vscode.workspace.getConfiguration( "customHtmlFormatter" );
  const current = config.get<FormatterRules>( "rules" ) ?? DEFAULT_RULES;

  // { ...current, ...patch },  // patch wins  
  // DEFAULT_RULES already applied to current if no rules at all
  await config.update(
    "rules",
    overWrite ? { ...current, ...patch } : { ...patch, ...current },  // path wins
    target
  );
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


export async function getConfigWriteScope(): Promise<ConfigWriteScope> {

  // User preference controlling where formatter-enabling commands 
  // write configuration (global or workspace).

  const writeScope = getCurrentConfigs()?.scope;

  if ( writeScope === "workspace" || writeScope === "global" ) {
    return writeScope;
  }

  // this SHOULD never be called, there is a default value === 'workspace'
  // but user might do something like this: "customHtmlFormatter.configWriteScope": "qwerty",
  const choice = await vscode.window.showQuickPick(
    [
      {
        label: "Apply globally (all projects)",
        scope: "global" as const
      },
      {
        label: "Apply to this workspace only",
        scope: "workspace" as const
      }
    ],
    {
      placeHolder: "Where should formatter settings be written?"
    }
  );

  if ( !choice ) {
    throw new Error( "User cancelled formatter enablement" );
  }

  const cfg = vscode.workspace.getConfiguration( "customHtmlFormatter" );

  await cfg.update(
    "configWriteScope",
    choice.scope,
    vscode.ConfigurationTarget.Global
    // ( stored === "workspace" ) ? false : true
  );

  return choice.scope;
}


// returns "workspace" or "global"
export async function translateScopeToText(): Promise<ConfigWriteScope> {
  const scope = vscode.workspace.getConfiguration( "customHtmlFormatter" )
    .get<ConfigWriteScope>( "configWriteScope" );

  return scope ? scope : "workspace";
}

// not currently used
// export async function getConfigurationTarget(): Promise<vscode.ConfigurationTarget> {

//   const scope = vscode.workspace.getConfiguration( "customHtmlFormatter" )
//     .get<ConfigWriteScope>( "configWriteScope" );

//   return ( scope === "workspace" ) ?
//     vscode.ConfigurationTarget.Workspace
//     : vscode.ConfigurationTarget.Global;
// }

