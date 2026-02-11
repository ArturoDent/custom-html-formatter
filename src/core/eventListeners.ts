import * as vscode from "vscode";

import { scheduleFormatterUpdate } from '../extension';
import {
  getLastFormattedUri,
  clearFormatRunState,
  isAwaitingFormatResultVersion,
  recordFormatResultVersion,
  getLastFormattedResultVersion
} from "../state/formatRunState";
import {
  setLastFormatterState,
  initCurrentConfigs,
  computeCurrentConfigs,
  clearCurrentConfigs,
} from "../state/formatterState";
import { clearLastRuleImpacts } from "./ruleImpact";
import { updateFormatterStatusBar, showFormatterStatusBar, hideFormatterStatusBar } from "../ui/statusBar";
import { computeFormatterDiagnostics, updateAllHtmlDiagnostics } from "../ui/diagnostics";


export function registerEventListeners( context: vscode.ExtensionContext ) {

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
      // await updateFormatter();

      // Use the scheduler so callers (including tests) can await a single observable promise
      await scheduleFormatterUpdate();

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
    } ),

    // if there no rules and default formatter is set to custom formatter 
    // this will run the built-in html formatter
    vscode.workspace.onWillSaveTextDocument( ( event ) => {
      const doc = event.document;
      if ( doc.languageId !== 'html' ) return;

      // Provide a promise immediately to waitUntil (do not await before calling waitUntil)
      event.waitUntil( ( async () => {
        try {
          const providerResult = await vscode.commands.executeCommand(
            'vscode.executeFormatDocumentProvider',
            doc.uri,
            { tabSize: 2, insertSpaces: true }
          );

          if ( !providerResult ) return;

          // Normalize to a flat array of candidate edits
          let candidates: any[] = [];
          if ( Array.isArray( providerResult ) ) {
            if ( providerResult.length > 0 && Array.isArray( providerResult[0] ) ) {
              candidates = ( providerResult as any[][] ).flat();
            } else {
              candidates = providerResult as any[];
            }
          } else {
            candidates = [providerResult];
          }

          const textEdits: vscode.TextEdit[] = [];

          for ( const e of candidates ) {
            if ( !e ) continue;

            // If it's already a TextEdit instance, use it
            if ( e instanceof vscode.TextEdit ) {
              textEdits.push( e );
              continue;
            }

            // If it has a Range instance directly (provider returns real Range)
            if ( e.range instanceof vscode.Range && typeof e.newText === 'string' ) {
              textEdits.push( new vscode.TextEdit( e.range, e.newText ) );
              continue;
            }

            // Unknown shape — skip and log for debugging
            console.warn( 'Skipping unknown edit shape', e );
          }

          if ( textEdits.length === 0 ) return;

          const workspaceEdit = new vscode.WorkspaceEdit();
          workspaceEdit.set( doc.uri, textEdits );

          console.log( workspaceEdit.entries() );
          console.log( workspaceEdit.entries()[0][1].map( ed => ( { isTextEdit: ed instanceof vscode.TextEdit, rangeType: ed.range?.constructor?.name } ) ) );

          // return workspaceEdit; // fails
          return textEdits; // applied before save
        } catch ( err ) {
          console.error( 'Formatting check failed', err );
          return; // allow save to continue on error
        }
      } )() );
    } )

  );
}