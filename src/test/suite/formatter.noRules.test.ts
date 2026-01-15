import * as assert from "node:assert";
import * as vscode from "vscode";
import * as fs from "fs";
import * as path from "path";

import {discoverFixtures} from "../utils/discoverFixtures";


suite("\nCustom HTML Formatter (no rules → default formatter)", function () {
  this.timeout(0);

  setup(async () => {
    await vscode.workspace
      .getConfiguration()
      .update(
        "[html]",
        {"editor.defaultFormatter": "vscode.html-language-features"},
        vscode.ConfigurationTarget.Global
      );
  });

  teardown(async () => {
    await vscode.workspace
      .getConfiguration("customHtmlFormatter")
      .update("rules", undefined, vscode.ConfigurationTarget.Global);
  });

  const fixturesDir = path.resolve(__dirname, "../fixtures/no-rules");
  const fixtures = discoverFixtures(fixturesDir);

  for (const fixture of fixtures) {
    test(`falls back to default formatter for ${fixture.name}`, async () => {
      // Explicitly clear rules
      await vscode.workspace
        .getConfiguration("customHtmlFormatter")
        .update("rules", undefined, vscode.ConfigurationTarget.Global);

      const input = fs.readFileSync(fixture.inputPath, "utf8");
      const expected = fs.readFileSync(fixture.expectedPath, "utf8");

      const doc = await vscode.workspace.openTextDocument({
        language: "html",
        content: input
      });

      await vscode.window.showTextDocument(doc);
      await vscode.commands.executeCommand("editor.action.formatDocument");

      const actual = doc.getText();

      assert.strictEqual(
        normalize(actual),
        normalize(expected),
        "Formatter should fall back to VS Code default when no rules are set"
      );
    });
  }
});

function normalize(text: string): string {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/\s+$/, "\n");
}
