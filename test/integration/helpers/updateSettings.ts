import * as vscode from "vscode";
import { FormatterRules, DEFAULT_RULES } from '../../../src/core/rules';

// export async function setAllConfigs( formatterId: string | undefined, rules: FormatterRules | undefined ) {
export async function setAllConfigs( formatterId: string | undefined, rules: any ) {

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

  const value = formatterId
    ? { "editor.defaultFormatter": formatterId }
    : undefined;

  await vscode.workspace
    .getConfiguration()
    .update( "[html]", value, vscode.ConfigurationTarget.Workspace );
}

export async function setHtmlFormatter( formatterId: string | undefined ) {
  const value = formatterId
    ? { "editor.defaultFormatter": formatterId }
    : undefined;

  await vscode.workspace
    .getConfiguration()
    .update( "[html]", value, vscode.ConfigurationTarget.Workspace );
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