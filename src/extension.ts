import * as vscode from "vscode";
import { setLastFormatterState, initCurrentConfigs, computeCurrentConfigs, showOpenSettingsPrompt } from "./state/formatterState";
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

	await updateFormatter();

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

	const currentConfig = await computeCurrentConfigs();
	const rules = currentConfig.rules;
	const customFormatter = ( currentConfig.defaultFormatter === "ArturoDent.custom-html-formatter" );

	if ( customFormatter && !rules ) {
		// TODO: force the built-in formatter (change settings)?
		// or remove the  "[html].editor.defaultFormatter" entry so vscode asks which formatter to use

		const target = ( currentConfig.scope === "workspace" ) ? vscode.ConfigurationTarget.Workspace : vscode.ConfigurationTarget.Global;
		showOpenSettingsPrompt( `Custom HTML Formatter is selected as the default formatter for HTML files, 
				but no rules are configured. VS Code will NOT fall back to the built-in HTML formatter while this
				setting is present. Formatting may appear disabled.`
			, target );
		return;
	}

	if ( !customFormatter ) return;

	if ( !rules || !Array.isArray( rules.noIndentUnder ) || rules.noIndentUnder.length === 0 ) {
		return;
	}

	if ( customFormatter ) {
		formatterDisposable = vscode.languages.registerDocumentFormattingEditProvider(
			selector,
			provider
		);
	}

	if ( formatterDisposable ) extensionContext.subscriptions.push( formatterDisposable );
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


function normalize( text: string ): string {
	return text.replace( /\r\n/g, "\n" ).replace( /\s+$/, "\n" );
}


export function deactivate() {}
