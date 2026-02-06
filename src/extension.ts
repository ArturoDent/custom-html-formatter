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
	showOpenSettingsPrompt
} from "./state/formatterState";
import { executeDryRun } from "./ui/dryRun";
import { formatterStatusBar, updateFormatterStatusBar, showFormatterStatusBar, hideFormatterStatusBar } from "./ui/statusBar";
import { formatterDiagnostics, computeFormatterDiagnostics, updateAllHtmlDiagnostics } from "./ui/diagnostics";
import { registerFormatterCodeActions } from "./ui/codeActions";
import { collectFormatterHealth } from "./state/formatterHealth";
import { renderHealthSnapshot } from "./state/formatterHealthOutput";
import { provider } from "./core/provider";

import {
	getLastFormattedUri,
	clearFormatRunState,
	recordFormatRun,
	markFormatRunStarted,
	isAwaitingFormatResultVersion,
	recordFormatResultVersion,
	getLastFormattedResultVersion
} from "./state/formatRunState";

import { getDocumentChanges } from "./core/formatter";
import {
	type RuleImpact,
	setLastRuleImpacts,
	clearLastRuleImpacts
} from "./core/ruleImpact";

// Test-only escape work-around for getting rule impacts.
let lastRuleImpacts: RuleImpact[] = [];

// Test-only, force custom formatter to be registered even if there are no rules
let _forceRegisterForTests = false;

let formatterDisposable: vscode.Disposable | undefined;
const selector: vscode.DocumentSelector = [{ language: "html" }];



export async function activate( context: vscode.ExtensionContext ) {

	const configs = await computeCurrentConfigs();
	initCurrentConfigs( configs );
	setLastFormatterState( configs.formatterState );

	// const provider: vscode.DocumentFormattingEditProvider = {
	// 	async provideDocumentFormattingEdits(
	// 		document: vscode.TextDocument
	// 	): Promise<vscode.TextEdit[] | undefined> {

	// 		// const rules = getCurrentConfigs()?.rules;
	// 		const rules = ( await computeCurrentConfigs() ).rules;

	// 		// Formatter is selected but not configured.
	// 		if ( !rules || !rules.noIndentUnder.length ) {
	// 			return undefined;
	// 		}

	// 		const original = document.getText();
	// 		const result = getDocumentChanges( original, rules );

	// 		// Internal runtime telemetry for health reporting.
	// 		setLastRuleImpacts( result.ruleImpacts );
	// 		recordFormatRun( document, result.ruleImpacts );

	// 		markFormatRunStarted();

	// 		// Normalize EOLs for comparison so CRLF vs LF doesn't look like a change
	// 		const normalize = ( s: string ) => s.replace( /\r\n/g, "\n" );
	// 		if ( normalize( result.text ) === normalize( original ) ) return undefined;

	// 		// Convert formatter output to the document's EOL before returning the edit
	// 		const eol = document.eol === vscode.EndOfLine.CRLF ? "\r\n" : "\n";
	// 		const textWithDocEol = result.text.replace( /\r\n|\n/g, eol );

	// 		const fullRange = new vscode.Range( document.positionAt( 0 ), document.positionAt( original.length ) );
	// 		return [vscode.TextEdit.replace( fullRange, textWithDocEol )];


	// 		// if ( result.text === original ) return undefined;

	// 		// const fullRange = new vscode.Range(
	// 		// 	document.positionAt( 0 ),
	// 		// 	document.positionAt( original.length )
	// 		// );

	// 		// return [vscode.TextEdit.replace( fullRange, result.text )];
	// 	}
	// };

	await updateFormatter();

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

	// ---------------- Diagnostics ----------------
	// Diagnostics reflect broken formatter state only,
	// not merely inactive or unconfigured behavior.

	context.subscriptions.push( formatterDiagnostics );

	const diagnostics = computeFormatterDiagnostics();
	updateAllHtmlDiagnostics( diagnostics );
	// ---------------------------------------------

	// ---------------- Code Actions ----------------
	// registration
	context.subscriptions.push( registerFormatterCodeActions() );
	// ----------------------------------------------

	// ---------------- Status Bar ------------------
	// The status bar reflects formatter state for the active editor only, i.e., all html files.
	// Created automatically by importing 'statusBar.ts'

	context.subscriptions.push( formatterStatusBar );

	if ( vscode.window.activeTextEditor?.document.languageId === "html" ) {
		await updateFormatterStatusBar();
		showFormatterStatusBar();
	}
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
			setLastFormatterState( configs.formatterState );

			// TODO: if (e.affectsConfiguration( "[html]" ))
			await updateFormatter();

			await updateFormatterStatusBar();

			const diagnostics = computeFormatterDiagnostics();
			updateAllHtmlDiagnostics( diagnostics );
		} ),

		vscode.window.onDidChangeActiveTextEditor( async ( event ) => {

			if ( vscode.window.activeTextEditor?.document.languageId === "html" ) {
				await updateFormatterStatusBar();
				showFormatterStatusBar();

				const diagnostics = computeFormatterDiagnostics();
				updateAllHtmlDiagnostics( diagnostics );
			}
			else {
				hideFormatterStatusBar();
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


	async function updateFormatter() {

		formatterDisposable?.dispose();
		formatterDisposable = undefined;

		const currentConfig = await computeCurrentConfigs();
		const rules = currentConfig.rules;
		const customFormatter = ( currentConfig.defaultFormatter === "ArturoDent.custom-html-formatter" );

		if ( customFormatter && !rules ) {
			// if ( customFormatter && !rules && !_forceRegisterForTests ) {

			const target = ( currentConfig.scope === "workspace" ) ? vscode.ConfigurationTarget.Workspace : vscode.ConfigurationTarget.Global;
			showOpenSettingsPrompt( `Custom HTML Formatter is selected as the default formatter for HTML files, 
				but no rules are configured. VS Code will NOT fall back to the built-in HTML formatter while this
				setting is present. Formatting may appear disabled.`
				, target );
			return;
		}

		if ( !customFormatter ) return;

		// if ( !_forceRegisterForTests && ( !rules || !Array.isArray( rules.noIndentUnder ) || rules.noIndentUnder.length === 0 ) ) {
		if ( !rules || !Array.isArray( rules.noIndentUnder ) || rules.noIndentUnder.length === 0 ) {
			return;
		}

		if ( customFormatter ) {
			formatterDisposable = vscode.languages.registerDocumentFormattingEditProvider(
				selector,
				provider
			);
		}

		if ( formatterDisposable ) context.subscriptions.push( formatterDisposable );
	}
}

// export function __test_forceRegisterFormatterForTests( enable: boolean ) {
// 	_forceRegisterForTests = enable;
// }


function normalize( text: string ): string {
	return text.replace( /\r\n/g, "\n" ).replace( /\s+$/, "\n" );
}


export function deactivate() {}
