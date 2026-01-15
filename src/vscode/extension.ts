/**
 * Custom HTML Formatter
 *
 * - Diagnostics are emitted only when formatting is broken.
 * - Informational state (e.g. which formatter is active, why rules applied)
 *   is surfaced on demand via health summaries, not warnings.
 * - Runtime telemetry (what happened) is kept separate from configuration
 *   resolution (what should happen).
 */

import * as vscode from "vscode";
import {
	setLastFormatterState,
	initCurrentConfigs,
	computeCurrentConfigs,
	clearCurrentConfigs,
	enableDefaults,
	restoreBuiltinHtmlFormatter,
	showQuickPickOptions,
	setCurrentConfigs
} from "../state/formatterState";
import { executeDryRun } from "./dryRun";
import { updateformatterSBI } from "./statusBar";
import { computeFormatterDiagnostics, updateAllHtmlDiagnostics } from "./diagnostics";
import { FormatterCodeActionProvider } from "./codeActions";
import { collectFormatterHealth } from "../state/formatterHealth";
import { renderHealthSnapshot } from "../state/formatterHealthOutput";

import {
	getLastFormattedUri,
	clearFormatRunState,
	recordFormatRun,
	markFormatRunStarted,
	isAwaitingFormatResultVersion,
	recordFormatResultVersion,
	getLastFormattedResultVersion
} from "../state/formatRunState";

import { getDocumentChanges } from "../core/formatter";
import { loadRulesFromConfig } from "../core/rules";
import {
	type RuleImpact,
	setLastRuleImpacts,
	clearLastRuleImpacts
} from "../core/ruleImpact";

// Test-only escape hatch for retrieving rule impacts.
// This is intentionally not part of the public API.
let lastRuleImpacts: RuleImpact[] = [];

export async function activate( context: vscode.ExtensionContext ) {

	const configs = await computeCurrentConfigs();
	initCurrentConfigs( configs );
	setLastFormatterState( configs.formatterState );

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
		vscode.commands.registerCommand( "customHtmlFormatter.statusClick", async () => {
			await showQuickPickOptions();
		} )
	);

	// ---------------- Diagnostics ----------------
	// Diagnostics reflect broken formatter state only,
	// not merely inactive or unconfigured behavior.
	const formatterDiagnostics =
		vscode.languages.createDiagnosticCollection( "custom-html-formatter" );

	context.subscriptions.push( formatterDiagnostics );

	const diagnostics = computeFormatterDiagnostics();
	updateAllHtmlDiagnostics( diagnostics, formatterDiagnostics );
	// ---------------------------------------------

	// ---------------- Code Actions ----------------
	context.subscriptions.push(
		vscode.languages.registerCodeActionsProvider(
			"html",
			new FormatterCodeActionProvider(),
			{
				providedCodeActionKinds:
					FormatterCodeActionProvider.providedCodeActionKinds
			}
		)
	);
	// ----------------------------------------------

	// ---------------- Status Bar ------------------
	// The status bar reflects formatter state for the active editor only, i.e., all html files.
	const formatterSBI = vscode.window.createStatusBarItem( vscode.StatusBarAlignment.Right, 500 );

	formatterSBI.command = "customHtmlFormatter.statusClick";

	if ( vscode.window.activeTextEditor?.document.languageId === "html" ) {
		await updateformatterSBI( formatterSBI );
		formatterSBI.show();
	}

	context.subscriptions.push( formatterSBI );
	// ---------------------------------------------

	// invalidate runtime formatter state and update SBI and diagnostics.
	context.subscriptions.push(
		vscode.workspace.onDidChangeConfiguration( async e => {
			if (
				!e.affectsConfiguration( "customHtmlFormatter.rules" ) &&
				!e.affectsConfiguration( "[html]" )
			) {
				return;
			}

			clearLastRuleImpacts();
			clearCurrentConfigs();

			const configs = await computeCurrentConfigs();
			initCurrentConfigs( configs );
			// setCurrentConfigs( configs );
			setLastFormatterState( configs.formatterState );

			await updateformatterSBI( formatterSBI );

			const diagnostics = computeFormatterDiagnostics();
			updateAllHtmlDiagnostics( diagnostics, formatterDiagnostics );
		} ),

		vscode.window.onDidChangeActiveTextEditor( async () => {

			if ( vscode.window.activeTextEditor?.document.languageId === "html" ) {
				await updateformatterSBI( formatterSBI );
				formatterSBI.show();

				const diagnostics = computeFormatterDiagnostics();
				updateAllHtmlDiagnostics( diagnostics, formatterDiagnostics );
			}
			else {
				formatterSBI.hide();
			}
		} ),


		vscode.workspace.onDidChangeTextDocument( event => {
			const doc = event.document;

			if ( doc.languageId !== "html" ) return;

			const lastUri = getLastFormattedUri();
			if ( !lastUri ) return;
			if ( doc.uri.toString() !== lastUri.toString() ) return;

			// FIRST change after formatting → record result version
			if ( isAwaitingFormatResultVersion() ) {
				recordFormatResultVersion( doc.version );
				return;
			}

			// Any later change → invalidate
			const resultVersion = getLastFormattedResultVersion();
			if ( resultVersion !== undefined && doc.version !== resultVersion ) {
				clearFormatRunState();
			}
		} )

	);

	// ---------------- Formatter Provider ----------------

	const selector: vscode.DocumentSelector = [{ language: "html" }];

	const provider: vscode.DocumentFormattingEditProvider = {
		async provideDocumentFormattingEdits(
			document: vscode.TextDocument
		): Promise<vscode.TextEdit[] | null> {

			const rules = configs.rules;

			// Formatter is selected but not configured.
			if ( !rules ) {
				return [];
			}

			const original = document.getText();
			const result = getDocumentChanges( original, rules );

			// Internal runtime telemetry for health reporting.
			setLastRuleImpacts( result.ruleImpacts );
			recordFormatRun( document, result.ruleImpacts );

			markFormatRunStarted();

			if ( result.text === original ) return [];

			const fullRange = new vscode.Range(
				document.positionAt( 0 ),
				document.positionAt( original.length )
			);

			return [vscode.TextEdit.replace( fullRange, result.text )];
		}
	};

	context.subscriptions.push(
		vscode.languages.registerDocumentFormattingEditProvider( selector, provider )
	);
}

export function deactivate() {}
