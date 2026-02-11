
import * as assert from "assert";
import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { scheduleFormatterUpdate } from '../../../src/extension';
import { setRules, setAllConfigs } from "../helpers/updateSettings";


suite( "Custom HTML Formatter - noIndentUnder", function () {
  // this.timeout( 0 );

  const fixturesRoot = path.resolve(
    __dirname,
    "../fixtures/no-indent"
  );

  // Discover case folders OR single-case folder
  const entries = fs.readdirSync( fixturesRoot );
  const caseFolders = entries.filter( name =>
    fs.statSync( path.join( fixturesRoot, name ) ).isDirectory()
  );

  // If no subfolders exist, treat the folder itself as a single case
  const testCases =
    caseFolders.length > 0 ? caseFolders : ["__single__"];

  setup( async () => {
    await setAllConfigs( "ArturoDent.custom-html-formatter", undefined );
    // Wait for the extension to process the configuration change and finish registration/unregistration
    await scheduleFormatterUpdate();
  } );

  teardown( async () => {
    await setAllConfigs( undefined, undefined );
    // Wait for the extension to process the configuration change and finish registration/unregistration
    await scheduleFormatterUpdate();
  } );

  for ( const testCase of testCases ) {
    const caseDir =
      testCase === "__single__"
        ? fixturesRoot
        : path.join( fixturesRoot, testCase );

    test( testCase, async () => {
      const inputPath = path.join( caseDir, "input.html" );
      const expectedPath = path.join( caseDir, "expected.html" );
      const configPath = path.join( caseDir, "config.json" );

      const input = fs.readFileSync( inputPath, "utf8" );
      const expected = fs.readFileSync( expectedPath, "utf8" );

      // Optional per-case config
      let rules: any = undefined;
      if ( fs.existsSync( configPath ) ) {
        rules = await JSON.parse( fs.readFileSync( configPath, "utf8" ) );
      }

      await setRules( rules );

      const doc = await vscode.workspace.openTextDocument( {
        language: "html",
        content: input
      } );

      await vscode.window.showTextDocument( doc );
      await vscode.commands.executeCommand( "editor.action.formatDocument" );

      const actual = doc.getText();

      //         console.log( "\n=========================== DIFF START ===========================" );
      //         const hasDiff = printLineDiff( expected, actual, {
      //           showLineNumbers: true
      //         } );
      //         console.log( "=========================== DIFF END =============================" );

      assert.strictEqual(
        normalize( actual ),
        normalize( expected ),
        `Fixture failed: ${testCase}`
      );
    } );
  }
} );

function normalize( text: string ): string {
  return text.replace( /\r\n/g, "\n" ).replace( /\s+$/, "\n" );
}
