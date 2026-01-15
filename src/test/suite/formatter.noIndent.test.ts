import * as assert from "node:assert";
import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

import { discoverFixtures } from "../utils/discoverFixtures";
import { printLineDiff } from "../utils/printLineDiff";
import { maybeUpdateFixture } from "../utils/updateFixture";
import { loadFixtureConfig } from "../utils/loadFixtureConfig";
import { printRuleSummary } from "../utils/printRuleSummary";
import type { RuleImpact } from "../../core/ruleImpact";


suite( "\nCustom HTML Formatter (no indent under html and body tags)", function () {
  this.timeout( 0 ); // ⬅ disable timeout entirely

  setup( async () => {
    await vscode.workspace.getConfiguration()
      .update( "[html]", { "editor.defaultFormatter": "ArturoDent.custom-html-formatter" },
        vscode.ConfigurationTarget.Global
      );
  } );

  teardown( async () => {
    await vscode.workspace
      .getConfiguration( "customHtmlFormatter" )
      .update( "rules", undefined, vscode.ConfigurationTarget.Global );
  } );

  const fixturesDir = path.resolve( __dirname, "../fixtures/no-indent" );
  const fixtures = discoverFixtures( fixturesDir );

  for ( const fixture of fixtures ) {

    //   test(`formats ${fixture.name}.input.html`, async () => {
    //     const rules = loadFixtureConfig(fixture.inputPath);

    const rules = loadFixtureConfig( fixture.inputPath );
    const description = rules.description ?? fixture.name;

    test( `${description}`, async () => {

      await vscode.workspace
        .getConfiguration( "customHtmlFormatter" )
        .update(
          "rules",
          Object.keys( rules ).length ? rules : undefined,
          vscode.ConfigurationTarget.Global
        );

      // Read fixtures: input and expected files
      const input = fs.readFileSync( fixture.inputPath, "utf8" );
      const expected = fs.readFileSync( fixture.expectedPath, "utf8" );

      // Open document
      const doc = await vscode.workspace.openTextDocument( {
        language: "html",
        content: input
      } );

      await vscode.window.showTextDocument( doc );
      await vscode.commands.executeCommand( "editor.action.formatDocument" );

      const actual = doc.getText();

      if ( normalize( actual ) !== normalize( expected ) ) {
        if ( maybeUpdateFixture( fixture.expectedPath, actual ) ) {
          return;
        }

        const ruleImpacts = await vscode.commands.executeCommand<RuleImpact[]>(
          "customHtmlFormatter._internal.getLastRuleImpacts"
        );

        console.log( "\n=========================== DIFF START ===========================" );
        const hasDiff = printLineDiff( expected, actual, {
          showLineNumbers: true
        } );
        console.log( "=========================== DIFF END =============================" );
        if ( hasDiff ) {
          printRuleSummary( ruleImpacts );
        }

        assert.fail( "Formatter output does not match expected fixture" );
      }
    } );
  }
} );

function normalize( text: string ): string {
  return text
    .replace( /\r\n/g, "\n" )
    .replace( /\s+$/, "\n" );
}
