import * as vscode from "vscode";
import { type FormatterRules, DEFAULT_RULES, loadRulesFromConfig } from './rules';
import { type FormatterState, setLastFormatterState, computeFormatterState } from '../state/formatterState';
import { beginInternalConfigUpdate, endInternalConfigUpdate } from './configUpdateGuard';


type ConfigWriteScope = "global" | "workspace";

//  ----------------------------- current configurations/settings -------------

export type CurrentConfigs = {
  scope: ConfigWriteScope;
  rules: FormatterRules | null;
  customFormatterEnabled: boolean;
  jsBeautifyEnabled: boolean;
  formatterState: FormatterState;
  defaultFormatter: string | undefined;
};

let currentConfigs: CurrentConfigs | undefined;

// can take 1-3 args
// setCurrentConfigs({ scope: "workspace" });
// setCurrentConfigs( { rules: newRules } );
// setCurrentConfigs({ rules: updatedRules, formatter: "active" });
// setCurrentConfigs({ scope: "global", rules: updatedRules, formatter: "builtin" });
//           currently not used
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
  // const defaultFormatter = vscode.workspace.getConfiguration( '', { languageId: "html" } ).get( 'editor.defaultFormatter' );

  const config = vscode.workspace.getConfiguration( "customHtmlFormatter" );

  const rulesRaw = config.get<FormatterRules | null>( "rules", null );
  const rules = loadRulesFromConfig( rulesRaw ) ?? null;  // else can return undefined
  const customFormatterEnabled = config.get<boolean>( "enabled", false );
  const jsBeautifyEnabled = config.get<boolean>( "jsBeautifyEnabled", false );

  const formatterState = await computeFormatterState( !!customFormatterEnabled, rules );  // TODO: check this
  const defaultFormatter = await getDefaultHtmlFormatter();

  return {
    rules, scope, customFormatterEnabled, jsBeautifyEnabled, formatterState, defaultFormatter
  };
}


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

  return ( scope === "workspace" ) ? "workspace" : "global";
}

// // not currently used
// // export async function getConfigurationTarget(): Promise<vscode.ConfigurationTarget> {

// //   const scope = vscode.workspace.getConfiguration( "customHtmlFormatter" )
// //     .get<ConfigWriteScope>( "configWriteScope" );

// //   return ( scope === "workspace" ) ?
// //     vscode.ConfigurationTarget.Workspace
// //     : vscode.ConfigurationTarget.Global;
// // }

// // enable or disable the Custom HTML Formatter
// export async function enableCustomFormatter( scope: ConfigWriteScope, enable: boolean ) {

//   const target = ( scope === "workspace" ) ? vscode.ConfigurationTarget.Workspace : vscode.ConfigurationTarget.Global;
//   await vscode.workspace
//     .getConfiguration( "customHtmlFormatter" )
//     .update( "enable", enable, target );
// }

//  enable the custom formatter only.
export async function enableCustomFormatter() {

  const scope = await getConfigWriteScope();
  const target =
    scope === "workspace"
      ? vscode.ConfigurationTarget.Workspace
      : vscode.ConfigurationTarget.Global;

  const config = vscode.workspace.getConfiguration();

  await config.update( "customHtmlFormatter.enabled", true, target );

  vscode.window.showInformationMessage(
    "Custom HTML Formatter enabled for this workspace."
  );
}

//  enable the custom formatter only.
export async function setCustomFormatterToDefault() {

  const scope = await getConfigWriteScope();
  const target =
    scope === "workspace"
      ? vscode.ConfigurationTarget.Workspace
      : vscode.ConfigurationTarget.Global;

  const config = vscode.workspace.getConfiguration();

  await config.update( "customHtmlFormatter.enabled", true, target );

  vscode.window.showInformationMessage(
    "Custom HTML Formatter set as the defaultFormatter for html."
  );
}

// enable or disable js-beautify
export async function enableJsBeautify( scope: ConfigWriteScope, enable: boolean ) {

  const target = ( scope === "workspace" ) ? vscode.ConfigurationTarget.Workspace : vscode.ConfigurationTarget.Global;
  await vscode.workspace
    .getConfiguration( "customHtmlFormatter" )
    .update( "jsBeautifyEanbled", enable, target );
}

//  enables the custom formatter with a default configuration.
export async function enableJsBeautifyOnly() {

  const scope = await getConfigWriteScope();
  const target =
    scope === "workspace"
      ? vscode.ConfigurationTarget.Workspace
      : vscode.ConfigurationTarget.Global;

  const config = vscode.workspace.getConfiguration();

  await config.update( "customHtmlFormatter.jsBeautifyEnabled", true, target );
  await config.update( "customHtmlFormatter.enabled", false, target );

  vscode.window.showInformationMessage(
    "js-beautify enabled and the Custom HTML Formatter disabled."
  );
}

// can pass in undefined to unset rules
// export async function setRules( rules: FormatterRules | undefined ) {

//   const target = ( scope === "workspace" ) ? vscode.ConfigurationTarget.Workspace : vscode.ConfigurationTarget.Global;
//   if ( rules ) {
//     await vscode.workspace
//       .getConfiguration( "customHtmlFormatter" )
//       .update( "rules", rules, target );
//   }
// }

export async function updateRules( patch: Partial<FormatterRules>, target: vscode.ConfigurationTarget, overWrite: boolean ) {

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

export async function setRulesToDefaults( scope: ConfigWriteScope ) {

  const target = ( scope === "workspace" ) ? vscode.ConfigurationTarget.Workspace : vscode.ConfigurationTarget.Global;
  await vscode.workspace
    .getConfiguration( "customHtmlFormatter" )
    .update( "rules", DEFAULT_RULES, target );
}

/**
 * Enables the custom formatter with a default configuration.
 *
 * This is an opt-in action that:
 * - sets default rules at the chosen scope/target
 * - and enables the custom formatter for HTML files
 */
export async function enableAllWithDefaults( noRules: boolean = true ) {

  const scope = await getConfigWriteScope();
  const target =
    scope === "workspace"
      ? vscode.ConfigurationTarget.Workspace
      : vscode.ConfigurationTarget.Global;

  const config = vscode.workspace.getConfiguration();

  await config.update( "customHtmlFormatter.jsBeautifyEnabled", true, target );
  await config.update( "customHtmlFormatter.enabled", true, target );

  if ( noRules ) {
    await config.update( "rules", DEFAULT_RULES, target );

    vscode.window.showInformationMessage(
      "js-beautify and Custom HTML Formatter and Rules enabled."
    );
  }
}

// can pass in undefined to unset defaultFormatter
export async function setDefaultHtmlFormatter( formatterId: string | undefined ) {

  if ( formatterId ) {
    const currentDefault = await getDefaultHtmlFormatter();
    if ( currentDefault === formatterId ) return;
  }

  const scope = await getConfigWriteScope();
  const target =
    scope === "workspace"
      ? vscode.ConfigurationTarget.Workspace
      : vscode.ConfigurationTarget.Global;

  const config = vscode.workspace.getConfiguration();
  const htmlOverrides = config.get<any>( "[html]" ) ?? {};

  let updated: any;

  if ( formatterId ) {
    updated = {
      ...htmlOverrides,
      "editor.defaultFormatter": formatterId
    };
  } else {
    // Remove the key but keep other settings
    const { ["editor.defaultFormatter"]: _, ...rest } = htmlOverrides;
    updated = Object.keys( rest ).length ? rest : undefined;
  }

  // await config.update( "[html]", updated, target );
  beginInternalConfigUpdate();
  try {
    await config.update( "[html]", updated, target );
  } finally {
    endInternalConfigUpdate();
  }

  vscode.window.showInformationMessage(
    `Default formatter set to ${formatterId} enabled for ${scope}.`
  );
}

/**
 * Restores VS Code's built-in HTML formatter explicitly.
 */
// export async function restoreBuiltinHtmlFormatter() {

//   const scope = await getConfigWriteScope();
//   const target =
//     scope === "workspace"
//       ? vscode.ConfigurationTarget.Workspace
//       : vscode.ConfigurationTarget.Global;

//   const config = vscode.workspace.getConfiguration();

//   await config.update( "customHtmlFormatter.enabled", false, target );

//   await config.update( "customHtmlFormatter.jsBeautifyEnabled", false, target );

//   vscode.window.showInformationMessage(
//     "VS Code's built-in HTML formatter has been restored."
//   );
// }

// built-in default: "vscode.html-language-features"
// "ArturoDent.custom-html-formatter"
export async function getDefaultHtmlFormatter(): Promise<string | undefined> {

  return vscode.workspace
    .getConfiguration( '', { languageId: 'html' } )
    .get<string>( 'editor.defaultFormatter' );
}
