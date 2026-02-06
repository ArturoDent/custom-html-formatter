// import * as assert from "node:assert";
// import * as vscode from "vscode";
// import * as fs from "fs";
// import * as path from "path";

// // import { discoverFixtures } from "../utils/discoverFixtures";
// import { printLineDiff } from "../..//utils/printLineDiff";
// import { maybeUpdateFixture } from "../..//utils/updateFixture";
// import { loadFixtureConfig } from "../../utils/loadFixtureConfig";
// import { printRuleSummary } from "../../../src/utils/printRuleSummary";
// import type { RuleImpact } from "../../../src/core/ruleImpact";
// import { DEFAULT_RULES } from '../../../src/core/rules';
// // import { waitForCustomFormatterState } from "../utils/waitForFormatterPresence";



// suite( "\nCustom HTML Formatter (no indent under html and body tags)", function () {
//   this.timeout( 0 ); // disable timeout entirely

//   setup( async () => {

//     // change rules first! then defaultFormatter
//     await vscode.workspace
//       .getConfiguration( "customHtmlFormatter" )
//       .update( "rules", DEFAULT_RULES, vscode.ConfigurationTarget.Workspace );

//     await vscode.workspace.getConfiguration()
//       .update( "[html]", { "editor.defaultFormatter": "ArturoDent.custom-html-formatter" },
//         vscode.ConfigurationTarget.Workspace
//       );
//   } );

//   teardown( async () => {
//     await vscode.workspace
//       .getConfiguration( "customHtmlFormatter" )
//       .update( "rules", undefined, vscode.ConfigurationTarget.Workspace );

//     await vscode.workspace.getConfiguration().update(
//       "[html]",
//       undefined,
//       vscode.ConfigurationTarget.Workspace
//     );
//   } );

//   const fixturesDir = path.resolve( __dirname, "../fixtures/no-indent" );
//   const fixtures = discoverFixtures( fixturesDir );   // change this

//   for ( const fixture of fixtures ) {

//     //   test(`formats ${fixture.name}.input.html`, async () => {
//     //     const rules = loadFixtureConfig(fixture.inputPath);

//     const rules = loadFixtureConfig( fixture.inputPath );
//     const description = rules.description ?? fixture.name;

//     test( `${description}`, async () => {

//       await vscode.workspace
//         .getConfiguration( "customHtmlFormatter" )
//         .update(
//           "rules",
//           Object.keys( rules ).length ? rules : undefined,
//           vscode.ConfigurationTarget.Workspace
//         );

//       // Read fixtures: input and expected files
//       const input = fs.readFileSync( fixture.inputPath, "utf8" );
//       const expected = fs.readFileSync( fixture.expectedPath, "utf8" );

//       // Open document
//       const doc = await vscode.workspace.openTextDocument( {
//         language: "html",
//         content: input
//       } );

//       await vscode.window.showTextDocument( doc );

//       // await waitForCustomFormatterState( true );

//       await vscode.commands.executeCommand( "editor.action.formatDocument" );

//       const actual = doc.getText();

//       if ( normalize( actual ) !== normalize( expected ) ) {
//         if ( maybeUpdateFixture( fixture.expectedPath, actual ) ) {
//           return;
//         }

//         const ruleImpacts = await vscode.commands.executeCommand<RuleImpact[]>(
//           "customHtmlFormatter._internal.getLastRuleImpacts"
//         );

//         console.log( "\n=========================== DIFF START ===========================" );
//         const hasDiff = printLineDiff( expected, actual, {
//           showLineNumbers: true
//         } );
//         console.log( "=========================== DIFF END =============================" );
//         if ( hasDiff ) {
//           printRuleSummary( ruleImpacts );
//         }

//         assert.fail( "Formatter output does not match expected fixture" );
//       }
//     } );
//   }
// } );

// function normalize( text: string ): string {
//   return text
//     .replace( /\r\n/g, "\n" )
//     .replace( /\s+$/, "\n" );
// }

import * as assert from "assert";
import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";
import { setHtmlFormatter, setRules, setAllConfigs } from "../helpers/updateSettings";

// import { printLineDiff } from "../..//utils/printLineDiff";

suite( "Custom HTML Formatter - noIndentUnder", function () {
  this.timeout( 0 );

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
    // await setRules( undefined );
    // await setHtmlFormatter( "ArturoDent.custom-html-formatter" );
    await setAllConfigs( "ArturoDent.custom-html-formatter", undefined );
  } );

  teardown( async () => {
    // await setRules( undefined );
    // await setHtmlFormatter( undefined );
    await setAllConfigs( undefined, undefined );
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
