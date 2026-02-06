import * as assert from "assert";
import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { setAllConfigs } from "../helpers/updateSettings";
import { applyFormatEdits } from "../helpers/applyFormatEdits";



suite( "Custom HTML Formatter + no rules → fallback to built-in", function () {
  this.timeout( 0 );

  const fixtureDir = path.resolve(
    __dirname,
    "../fixtures/no-rules"
  );

  const inputPath = path.join( fixtureDir, "input.html" );
  const expectedPath = path.join( fixtureDir, "expected.html" );

  setup( async () => {
    await setAllConfigs( "vscode.html-language-features", undefined );
  } );

  teardown( async () => {
    await setAllConfigs( undefined, undefined );
  } );


  test( "html and body to flush left, nothing else changes", async () => {
    // Explicitly clear rules again inside the test
    // await setAllConfigs( "vscode.html-language-features", undefined );

    const input = fs.readFileSync( inputPath, "utf8" );
    const expected = fs.readFileSync( expectedPath, "utf8" );

    const doc = await vscode.workspace.openTextDocument( { language: "html", content: input } );
    await vscode.window.showTextDocument( doc );

    // Give extension/config listeners a moment to settle if needed
    await new Promise( ( r ) => setTimeout( r, 50 ) );

    const edits = await applyFormatEdits( doc );
    console.log( "Providers returned edits count:", edits.length );

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
}