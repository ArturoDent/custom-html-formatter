import * as vscode from "vscode";
import {formatHtmlDocument} from './formatter';
import {loadRulesFromConfig} from './rules';
// import type { RuleImpact } from "./ruleImpact";


export function activate(context: vscode.ExtensionContext) {
	
	// let lastRuleImpacts: RuleImpact[] = [];

	// context.subscriptions.push(
	// 	vscode.commands.registerCommand(
	// 		"customHtmlFormatter.getLastRuleImpacts",
	// 		() => lastRuleImpacts
	// 	)
	// );

	
	const selector: vscode.DocumentSelector = [{language: "html"}];

	const provider: vscode.DocumentFormattingEditProvider = {
		provideDocumentFormattingEdits(document: vscode.TextDocument): vscode.TextEdit[] {
			const original = document.getText();
			const cfg = vscode.workspace.getConfiguration("customHtmlFormatter");
			// TODO: remove 'any', test
			// const rules = loadRulesFromConfig(cfg.get<any>("rules"));
			const rules = loadRulesFromConfig(cfg.get<vscode.WorkspaceConfiguration>("rules"));

			const formatted = formatHtmlDocument(original, rules);
			
			// lastRuleImpacts = result.ruleImpacts;
			
			if (formatted === original) return [];

			const fullRange = new vscode.Range(
				document.positionAt(0),
				document.positionAt(original.length)
			);

			return [vscode.TextEdit.replace(fullRange, formatted)];
		}
	};

	context.subscriptions.push(
		vscode.languages.registerDocumentFormattingEditProvider(selector, provider)
	);
}

export function deactivate() {}
