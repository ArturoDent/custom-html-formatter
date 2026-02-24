import * as vscode from "vscode";
import { DEFAULT_RULES } from '../../src/core/rules';

// export async function setAllConfigs( formatterId: string | undefined, rules: FormatterRules | undefined ) {
export async function setAllConfigs( formatterId: string | undefined, rules: any ) {

  await enableCustomFormatter( true );
  await enableJsBeautify( true );

  if ( rules ) {
    delete rules.description;
    await vscode.workspace
      .getConfiguration( "customHtmlFormatter" )
      .update( "rules", rules, vscode.ConfigurationTarget.Workspace );
  }
  else {
    await vscode.workspace
      .getConfiguration( "customHtmlFormatter" )
      .update( "rules", undefined, vscode.ConfigurationTarget.Workspace );
  }

  await setDefaultHtmlFormatter( formatterId );

  // const value = formatterId
  //   ? { "editor.defaultFormatter": formatterId }
  //   : undefined;

  // await vscode.workspace
  //   .getConfiguration()
  //   .update( "[html]", value, vscode.ConfigurationTarget.Workspace );
}

// export async function setHtmlFormatter( formatterId: string | undefined ) {
//   const value = formatterId
//     ? { "editor.defaultFormatter": formatterId }
//     : undefined;

//   await vscode.workspace
//     .getConfiguration()
//     .update( "[html]", value, vscode.ConfigurationTarget.Workspace );
// }

// can pass in undefined to unset defaultFormatter
export async function setDefaultHtmlFormatter( formatterId: string | undefined ) {

  // if ( formatterId ) {
  //   const currentDefault = await getDefaultHtmlFormatter();
  //   if ( currentDefault === formatterId ) return;
  // }

  const target = vscode.ConfigurationTarget.Workspace;

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

  await config.update( "[html]", updated, target );
}

//  enable the custom formatter only.
export async function enableCustomFormatter( enable: boolean ) {

  const target = vscode.ConfigurationTarget.Workspace;
  const config = vscode.workspace.getConfiguration();
  await config.update( "customHtmlFormatter.enabled", enable, target );
}

// enable or disable js-beautify
export async function enableJsBeautify( enable: boolean ) {

  const target = vscode.ConfigurationTarget.Workspace;
  await vscode.workspace
    .getConfiguration( "customHtmlFormatter" )
    .update( "jsBeautifyEnabled", enable, target );
}

// export async function setRules( rules: FormatterRules | undefined ) {
export async function setRules( rules: any ) {
  delete rules.description;
  await vscode.workspace
    .getConfiguration( "customHtmlFormatter" )
    .update( "rules", rules, vscode.ConfigurationTarget.Workspace );
}

export async function setRulesToDefaults() {
  await vscode.workspace
    .getConfiguration( "customHtmlFormatter" )
    .update( "rules", DEFAULT_RULES, vscode.ConfigurationTarget.Workspace );
}