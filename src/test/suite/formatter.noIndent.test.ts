import * as assert from "node:assert";
import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

import { discoverFixtures }   from "../utils/discoverFixtures";
import { printLineDiff }      from "../utils/printLineDiff";
import { maybeUpdateFixture } from "../utils/updateFixture";
import { loadFixtureConfig }  from "../utils/loadFixtureConfig";
import {printRuleSummary} from "../utils/printRuleSummary";
import { clearRuleImpacts, RuleImpact } from "../../ruleImpact";


suite("Custom HTML Formatter (no indent under html and body tags)", () => {
  teardown(async () => {
    await vscode.workspace
      .getConfiguration("customHtmlFormatter")
      .update("rules", undefined, vscode.ConfigurationTarget.Global);
  });

  const fixturesDir = path.resolve(__dirname, "../fixtures/no-indent");
  const fixtures = discoverFixtures(fixturesDir);

  for (const fixture of fixtures) {
    test(`formats ${fixture.name}.input.html`, async () => {
      // Configure formatter
      // await vscode.workspace.getConfiguration("customHtmlFormatter").update(
      //   "rules",
      //   {
      //     noIndentUnder: ["html", "body"],
      //     indentSize: 2
      //   },
      //   vscode.ConfigurationTarget.Global
      // );
      
      const rules = loadFixtureConfig(fixture.inputPath);

      await vscode.workspace
        .getConfiguration("customHtmlFormatter")
        .update(
          "rules",
          Object.keys(rules).length ? rules : undefined,
          vscode.ConfigurationTarget.Global
        );

      // Read fixtures
      const input = fs.readFileSync(fixture.inputPath, "utf8");
      const expected = fs.readFileSync(fixture.expectedPath, "utf8");

      // Open document
      const doc = await vscode.workspace.openTextDocument({
        language: "html",
        content: input
      });

      await vscode.window.showTextDocument(doc);
      clearRuleImpacts();
      await vscode.commands.executeCommand("editor.action.formatDocument");

      const actual = doc.getText();

      if (normalize(actual) !== normalize(expected)) {
        if (maybeUpdateFixture(fixture.expectedPath, actual)) {
          return;
        }
        
        const ruleImpacts = await vscode.commands.executeCommand<RuleImpact[]>(
          "customHtmlFormatter.getLastRuleImpacts"
        );

        console.log("=========================== DIFF START ===========================");
        // printLineDiff(expected, actual, {showLineNumbers: true});
        // printRuleSummary();
        // printRuleSummary(ruleImpacts ?? []);
    
        const hasDiff = printLineDiff(expected, actual, {
          // header: "=== RAW LINE DIFF ===",
          showLineNumbers: true
        });

        if (hasDiff) {
          printRuleSummary(ruleImpacts);
        }
        console.log("=========================== DIFF END ===========================");

        assert.fail("Formatter output does not match expected fixture");
      }
    });
  }
});

function normalize(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\s+$/, "\n");
}
