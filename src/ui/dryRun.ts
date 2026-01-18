import * as vscode from "vscode";
import { getDocumentChanges } from '../core/formatter';
import { loadRulesFromConfig } from '../core/rules';
import { setLastDryRunImpacts } from '../state/formatRunState';
import { printRuleSummary } from "../test/utils/printRuleSummary";
import { getCurrentConfigs } from '../state/formatterState';


export function executeDryRun() {
  const editor = vscode.window.activeTextEditor;
  if ( !editor ) return;

  // const cfgRules = vscode.workspace
  //   .getConfiguration( "customHtmlFormatter" )
  //   .get( "rules" );

  // const rules = loadRulesFromConfig( cfgRules );

  const rules = getCurrentConfigs()?.rules;

  // if ( !cfgRules || !rules ) return;
  if ( !rules ) return;

  const original = editor.document.getText();

  const result = getDocumentChanges( original, rules );
  setLastDryRunImpacts( result.ruleImpacts );
  printRuleSummary( result.ruleImpacts );
}
