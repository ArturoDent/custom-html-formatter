import * as assert from "assert";
import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { scheduleFormatterUpdate } from '../../../src/extension';
import { setAllConfigs } from "../../helpers/updateSettings";
import { applyFormatEdits } from "../../helpers/applyFormatEdits";



suite( "jsBeautify + Custom HTML Formatter + no rules → js-beautify only formatting", function () {
  // this.timeout( 0 );

  const fixtureDir = path.resolve(
    __dirname,
    "../fixtures/no-rules"
  );

  const inputPath = path.join( fixtureDir, "input.html" );
  const expectedPath = path.join( fixtureDir, "expected.html" );

  setup( async () => {
    // await setAllConfigs( "vscode.html-language-features", undefined );
    await setAllConfigs( "ArturoDent.custom-html-formatter", undefined );
    // Wait for the extension to process the configuration change and finish registration/unregistration
    await scheduleFormatterUpdate();
  } );

  teardown( async () => {
    await setAllConfigs( undefined, undefined );
    // Wait for the extension to process the configuration change and finish registration/unregistration
    await scheduleFormatterUpdate();
  } );


  test( "html and body to flush left, nothing else changes", async () => {

    const input = fs.readFileSync( inputPath, "utf8" );
    const expected = fs.readFileSync( expectedPath, "utf8" );

    const doc = await vscode.workspace.openTextDocument( { language: "html", content: input } );
    await vscode.window.showTextDocument( doc );

    // Give extension/config listeners a moment to settle if needed
    await new Promise( ( r ) => setTimeout( r, 50 ) );

    const edits = await applyFormatEdits( doc );
    console.log( "      Providers returned edits count:", edits.length );

    const actual = doc.getText();

    assert.strictEqual(
      normalize( actual ),
      normalize( expected ),
      "Formatter should fall back to VS Code default when no rules are set"
    );
  } );
} );


function normalize( text: string ): string {
  return text.replace( /\r\n/g, "\n" ).replace( /\s+$/, "\n" );
  // return text.replace( /\r\n/g, "\n" );
}