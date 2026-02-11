import * as vscode from "vscode";
import {
  enableDefaults,
  restoreBuiltinHtmlFormatter,
  showQuickPickOptions,
} from '../state/formatterState';
import { executeDryRun } from "../ui/dryRun";
import { collectFormatterHealth } from "../state/formatterHealth";
import { renderHealthSnapshot } from "../state/formatterHealthOutput";

import type { RuleImpact } from "../core/ruleImpact";

// Test-only escape work-around for getting rule impacts.
let lastRuleImpacts: RuleImpact[] = [];

export function registerCommands( context: vscode.ExtensionContext ) {
  /**
   * Internal command used by formatter tests that do not run
   * inside the ExtensionHost environment.
   */
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "customHtmlFormatter._internal.getLastRuleImpacts",
      () => lastRuleImpacts
    )
  );


  context.subscriptions.push(
    vscode.commands.registerCommand(
      "customHtmlFormatter.enableWithDefaults",
      enableDefaults
    )
  );

  context.subscriptions.push(
    vscode.commands.registerCommand(
      "customHtmlFormatter.dryRun",
      executeDryRun
    )
  );

  // not exposed to user, called by CodeActions and StatusBarItem
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "customHtmlFormatter._internal.chooseFormatter",
      showQuickPickOptions
    )
  );


  context.subscriptions.push(
    vscode.commands.registerCommand(
      "customHtmlFormatter.restoreBuiltinHtmlFormatter",
      restoreBuiltinHtmlFormatter,
    )
  );


  vscode.commands.registerCommand(
    "customHtmlFormatter.showHealth",
    () => {
      const snapshot = collectFormatterHealth();
      renderHealthSnapshot( snapshot );
    }
  );


  // Status bar click
  context.subscriptions.push(
    vscode.commands.registerCommand( "customHtmlFormatter.statusClick", async ( args ) => {
      await showQuickPickOptions();
    } )
  );

}