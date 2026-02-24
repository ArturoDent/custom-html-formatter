import * as vscode from "vscode";
import { initCurrentConfigs, computeCurrentConfigs, CurrentConfigs, getDefaultHtmlFormatter, setDefaultHtmlFormatter } from "./core/configs";
import { setLastFormatterState } from "./state/formatterState";
import { showOpenSettingsPrompt } from "./ui/quickPick";

import { formatterStatusBar, updateFormatterStatusBar, showFormatterStatusBar } from "./ui/statusBar";
import { formatterDiagnostics, computeFormatterDiagnostics, updateAllHtmlDiagnostics } from "./ui/diagnostics";
import { registerFormatterCodeActions } from "./ui/codeActions";
import { provider } from "./core/provider";
import { registerCommands } from './core/commands';
import { registerEventListeners } from './core/eventListeners';

let extensionContext: vscode.ExtensionContext;
let formatterDisposable: vscode.Disposable | undefined;
const selector: vscode.DocumentSelector = [{ language: "html" }];


export async function activate( context: vscode.ExtensionContext ) {

	extensionContext = context;
	const configs = await computeCurrentConfigs();
	initCurrentConfigs( configs );
	setLastFormatterState( configs.formatterState );

	// await updateFormatter();
	await scheduleFormatterUpdate();

	registerEventListeners( context );
	registerCommands( context );

	// ---------------- Diagnostics ----------------
	// Diagnostics surface broken formatter state 
	// including inactive or unconfigured behavior.

	context.subscriptions.push( formatterDiagnostics );

	const diagnostics = computeFormatterDiagnostics();
	updateAllHtmlDiagnostics( diagnostics );

	// ---------------- Code Actions ----------------
	context.subscriptions.push( registerFormatterCodeActions() );
	// ----------------------------------------------

	// ---------------- Status Bar ------------------
	// The status bar reflects formatter state for the active editor only, i.e., all html files.
	// Created automatically by importing 'statusBar.ts' above

	context.subscriptions.push( formatterStatusBar );

	if ( vscode.window.activeTextEditor?.document.languageId === "html" ) {
		await updateFormatterStatusBar();
		showFormatterStatusBar();
	}
}

async function updateFormatter() {
	formatterDisposable?.dispose();
	formatterDisposable = undefined;

	const currentConfigs: CurrentConfigs = await computeCurrentConfigs();
	const { customFormatterEnabled, jsBeautifyEnabled, rules, scope, defaultFormatter } = currentConfigs;

	const target =
		scope === "workspace"
			? vscode.ConfigurationTarget.Workspace
			: vscode.ConfigurationTarget.Global;

	// ---------------------------------------------------------
	// 1. If js-beautify is disabled, we cannot register ANY formatter
	// ---------------------------------------------------------
	if ( !jsBeautifyEnabled ) {

		if ( defaultFormatter !== "vscode.html-language-features" )   // TODO: set to undefined ?
			await setDefaultHtmlFormatter( "vscode.html-language-features" );

		if ( customFormatterEnabled ) {
			showOpenSettingsPrompt(
				"The Custom HTML Formatter is enabled, but js-beautify is NOT enabled. The built-in VS Code HTML formatter will be applied.",
				target
			);
		}
		// do not register
		return;
	}

	// ---------------------------------------------------------
	// 2. js-beautify is enabled, but custom formatter is disabled
	//    → still register provider (js-beautify-only mode)
	// ---------------------------------------------------------
	if ( !customFormatterEnabled ) {
		showOpenSettingsPrompt(
			"The Custom HTML Formatter is NOT enabled, js-beautify is enabled. The js-beautify HTML formatter will be applied.",
			target
		);

		// Still register provider (it will run js-beautify only)
		if ( defaultFormatter !== "ArturoDent.custom-html-formatter" )
			await setDefaultHtmlFormatter( "ArturoDent.custom-html-formatter" );

		formatterDisposable = vscode.languages.registerDocumentFormattingEditProvider(
			selector,
			provider
		);
		extensionContext.subscriptions.push( formatterDisposable );
		return;
	}

	// ---------------------------------------------------------
	// 3. Custom formatter is enabled, but rules are missing
	//    → warn, but STILL register provider
	// ---------------------------------------------------------
	const noRules =
		!rules ||
		!Array.isArray( rules.noIndentUnder ) ||
		rules.noIndentUnder.length === 0;

	if ( noRules ) {
		showOpenSettingsPrompt(
			"The Custom HTML Formatter is enabled, but no rules are configured. Only js-beautify HTML formatting will be applied.",
			target
		);
		// Still register provider (js-beautify-only mode)
	}

	// ---------------------------------------------------------
	// 4. Register provider ALWAYS when js-beautify is enabled
	// ---------------------------------------------------------
	if ( defaultFormatter !== "ArturoDent.custom-html-formatter" )
		await setDefaultHtmlFormatter( "ArturoDent.custom-html-formatter" );

	formatterDisposable = vscode.languages.registerDocumentFormattingEditProvider(
		selector,
		provider
	);

	extensionContext.subscriptions.push( formatterDisposable );
}

// module scope
let lastUpdatePromise: Promise<void> | null = null;

/**
 * Schedule or await a formatter update. If an update is already in progress,
 * callers get the same promise. When the update completes, the promise clears.
 */
export async function scheduleFormatterUpdate(): Promise<void> {
	if ( lastUpdatePromise ) return lastUpdatePromise;

	lastUpdatePromise = ( async () => {
		try {
			await updateFormatter();
		} finally {
			// ensure the promise is cleared so future updates create a new one
			lastUpdatePromise = null;
		}
	} )();

	return lastUpdatePromise;
}


export function deactivate() {}
