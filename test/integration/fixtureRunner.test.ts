import * as vscode from "vscode";
import * as assert from "assert";
import * as fs from "fs";
import * as path from "path";

import { scheduleFormatterUpdate } from '../../src/extension';
import { FormatterRules } from '../../src/core/rules';
import { openFixtureDocument } from "../helpers/documents";
import { setAllConfigs } from "../helpers/updateSettings";
import { applyFormatEdits } from "../helpers/applyFormatEdits";

suite( "Golden Fixtures", async () => {
  const fixturesRoot = path.resolve( __dirname, "../fixtures" );

  for await ( const group of fs.readdirSync( fixturesRoot ) ) {
    const groupFolder = path.join( fixturesRoot, group );
    if ( !fs.statSync( groupFolder ).isDirectory() ) continue;

    suite( group, async () => {
      const entries = fs.readdirSync( groupFolder );

      const hasDirectInput =
        entries.includes( "input.html" ) && entries.includes( "expected.html" );

      // Normalization helper (single place)
      function normalize( text: string ): string {
        return text.replace( /\r\n/g, "\n" ).replace( /\s+$/, "\n" );
      }

      if ( hasDirectInput ) {
        // Case: e.g., fixtures/basic/input.html
        test( "", async () => {
          const configPath = path.join( groupFolder, "config.json" );
          let rules: FormatterRules | undefined = undefined;
          let configContents;

          if ( fs.existsSync( configPath ) ) {
            configContents = await JSON.parse( fs.readFileSync( configPath, "utf8" ) );
            rules = { indentSize: configContents.indentSize, noIndentUnder: configContents.noIndentUnder };
          }

          await setAllConfigs( "ArturoDent.custom-html-formatter", rules );

          // 🔥 Ensure extension is activated BEFORE updateFormatter runs
          await vscode.extensions.getExtension( "ArturoDent.custom-html-formatter" )?.activate();

          // Wait for the extension to process the configuration change and finish registration/unregistration
          await scheduleFormatterUpdate();

          const input = await openFixtureDocument( `${group}/input.html` );
          const expected = fs.readFileSync(
            path.join( groupFolder, "expected.html" ),
            "utf8"
          );

          // Give the extension time to react to config changes and register/unregister providers
          await new Promise( r => setTimeout( r, 50 ) );

          // Run the full VS Code formatting pipeline and apply any edits returned.
          // This ensures the built-in formatter will run if the custom formatter is not registered.
          await applyFormatEdits( input );

          const actual = input.getText();
          assert.strictEqual( normalize( actual ), normalize( expected ) );
        } );
      }

      // Case: fixtures/no-indent/case-basic/input.html
      for await ( const testCase of entries ) {
        const caseFolder = path.join( groupFolder, testCase );
        if ( !fs.statSync( caseFolder ).isDirectory() ) continue;

        test( testCase, async () => {
          const configPath = path.join( caseFolder, "config.json" );
          let rules: any = undefined;

          if ( fs.existsSync( configPath ) ) {
            rules = await JSON.parse( fs.readFileSync( configPath, "utf8" ) );
          }

          await setAllConfigs( "ArturoDent.custom-html-formatter", rules );

          // 🔥 Ensure extension is activated BEFORE updateFormatter runs
          await vscode.extensions.getExtension( "ArturoDent.custom-html-formatter" )?.activate();

          // Wait for the extension to process the configuration change and finish registration/unregistration
          await scheduleFormatterUpdate();

          const input = await openFixtureDocument(
            `${group}/${testCase}/input.html`
          );

          const expected = fs.readFileSync(
            path.join( caseFolder, "expected.html" ),
            "utf8"
          );

          // Give the extension time to react to config changes and register/unregister providers
          await new Promise( r => setTimeout( r, 50 ) );

          // Run the full VS Code formatting pipeline and apply any edits returned.
          // This ensures the built-in formatter will run if the custom formatter is not registered.
          await applyFormatEdits( input );

          // Read the document after edits were applied
          const actual = input.getText();

          // Normalize line endings and trailing whitespace before comparing
          assert.strictEqual( normalize( actual ), normalize( expected ) );
        } );
      }
    } );
  }
} );