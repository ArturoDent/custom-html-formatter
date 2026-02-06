import * as vscode from "vscode";
import { computeCurrentConfigs } from "../state/formatterState";
import { getDocumentChanges } from "./formatter";
import { setLastRuleImpacts } from "./ruleImpact";
import { markFormatRunStarted, recordFormatRun } from "../state/formatRunState";

export const provider: vscode.DocumentFormattingEditProvider = {
  async provideDocumentFormattingEdits(
    document: vscode.TextDocument,
    formattingOptions: vscode.FormattingOptions,
    token: vscode.CancellationToken
  ): Promise<vscode.TextEdit[] | undefined> {

    const rules = ( await computeCurrentConfigs() ).rules;

    // Decline if no rules or noIndentUnder is empty
    if ( !rules || !rules.noIndentUnder?.length ) {
      return undefined;
    }

    const original = document.getText();
    const result = getDocumentChanges( original, rules );

    // Telemetry
    setLastRuleImpacts( result.ruleImpacts );
    recordFormatRun( document, result.ruleImpacts );
    markFormatRunStarted();

    // Normalize EOLs for comparison
    const normalize = ( s: string ) => s.replace( /\r\n/g, "\n" );
    if ( normalize( result.text ) === normalize( original ) ) {
      return undefined;
      // or return [] so that the built-in formatter does not run
    }

    // Convert formatter output to document EOL
    const eol = document.eol === vscode.EndOfLine.CRLF ? "\r\n" : "\n";
    const textWithDocEol = result.text.replace( /\r\n|\n/g, eol );

    const fullRange = new vscode.Range(
      document.positionAt( 0 ),
      document.positionAt( original.length )
    );

    return [vscode.TextEdit.replace( fullRange, textWithDocEol )];
  }
};