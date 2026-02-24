import * as vscode from "vscode";
import { html as beautifyHtml } from 'js-beautify';
import { getBeautifyOptions, loadJsBeautifyRc } from './Beautify';
import { getCurrentConfigs } from '../core/configs';
import { getDocumentChanges } from './formatter';
// import { diffLines } from 'diff';
import { setLastRuleImpacts } from "./ruleImpact";
import { markFormatRunStarted, recordFormatRun } from "../state/formatRunState";


export const provider: vscode.DocumentFormattingEditProvider = {

  async provideDocumentFormattingEdits( document: vscode.TextDocument, options: vscode.FormattingOptions ) {

    const original = document.getText();

    // 1) js-beautify: get beautified html
    // shouldn't be able to get here if js-beautify is disabled

    // const beautifyOptions = {
    //   ...getBeautifyOptions( document, options ),
    //   indent_inner_html: true,
    //   indent_body_inner_html: true,
    //   indent_head_inner_html: true
    // };

    const baseOptions = getBeautifyOptions( options );
    const rcOptions = loadJsBeautifyRc( document );

    const beautifyOptions = {
      ...baseOptions,
      ...rcOptions, // .jsbeautifyrc workspace overrides built-in defaults
    };
    const builtInText = beautifyHtml( original, beautifyOptions );

    // 2) check configs, return if Custom HTML Formatter is not enabled or no rules
    const configs = getCurrentConfigs();
    const rules = configs?.rules;


    if ( !configs?.customFormatterEnabled || !rules || !rules.noIndentUnder?.length ) {

      // js-beautify-only mode

      const normalize = ( s: string ) => s.replace( /\r\n/g, "\n" );

      if ( normalize( builtInText ) === normalize( original ) ) {
        return []; // nothing to do
      }

      const fullRange = new vscode.Range(
        document.positionAt( 0 ),
        document.positionAt( original.length )
      );

      return [vscode.TextEdit.replace( fullRange, builtInText )];
    }

    // 3) Custom HTML Formatter pass, enabled and rules
    const result = getDocumentChanges( builtInText, rules );
    const finalText = result.text;

    // 4) internal telemetry
    setLastRuleImpacts( result.ruleImpacts );
    recordFormatRun( document, result.ruleImpacts );
    markFormatRunStarted();

    // 5) normalize EOLs for comparison
    const normalize = ( s: string ) => s.replace( /\r\n/g, "\n" );
    if ( normalize( finalText ) === normalize( original ) ) {
      return []; // nothing to do
    }

    // 6) convert formatter output to document EOL
    const eol = document.eol === vscode.EndOfLine.CRLF ? "\r\n" : "\n";
    const finalWithDocEol = finalText.replace( /\r\n|\n/g, eol );

    // 7) Calculate document range
    const fullRange = new vscode.Range(
      document.positionAt( 0 ),
      document.positionAt( original.length )
    );

    return [vscode.TextEdit.replace( fullRange, finalWithDocEol )];
  }
};

// not used - doesn't work when these are returned above instead of the fullRange edit
// export function computeMinimalTextEdits(
//   document: vscode.TextDocument,
//   oldText: string,
//   newText: string
// ): vscode.TextEdit[] {
//   if ( oldText === newText ) return [];

//   const diffs = diffLines( oldText, newText );
//   const edits: vscode.TextEdit[] = [];

//   let currentLine = 0;

//   for ( const part of diffs ) {
//     const lineCount = part.value.split( /\r?\n/ ).length - 1;

//     if ( part.added ) {
//       const safeLine = Math.min( currentLine, document.lineCount - 1 );
//       const pos = document.lineAt( safeLine ).range.end;

//       const text = part.value.endsWith( "\n" )
//         ? part.value.slice( 0, -1 )
//         : part.value;

//       edits.push( vscode.TextEdit.insert( pos, text ) );
//     } else if ( part.removed ) {
//       const safeStart = Math.min( currentLine, document.lineCount - 1 );
//       const safeEnd = Math.min( currentLine + lineCount, document.lineCount - 1 );

//       const start = document.lineAt( safeStart ).range.start;
//       const end = document.lineAt( safeEnd ).range.end;

//       edits.push( vscode.TextEdit.delete( new vscode.Range( start, end ) ) );
//     } else {
//       currentLine += lineCount;
//     }
//   }

//   return edits;
// }
