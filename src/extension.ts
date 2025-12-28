import * as vscode from "vscode";
import {formatHtmlDocument} from './formatter';
import {loadRulesFromConfig} from './rules';

export function activate(context: vscode.ExtensionContext) {
	const selector: vscode.DocumentSelector = [{language: "html"}];

	const provider: vscode.DocumentFormattingEditProvider = {
		provideDocumentFormattingEdits(document: vscode.TextDocument): vscode.TextEdit[] {
			const original = document.getText();
			const cfg = vscode.workspace.getConfiguration("customHtmlFormatter");
			const rules = loadRulesFromConfig(cfg.get<any>("rules"));

			const formatted = formatHtmlDocument(original, rules);
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
