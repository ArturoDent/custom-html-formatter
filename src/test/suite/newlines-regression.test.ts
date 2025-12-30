import * as assert from "node:assert";
import * as vscode from "vscode";

function newlineTokens(s: string): string[] {
  return s.match(/\r\n|\n/g) ?? [];
}

suite("Custom HTML Formatter newline regression", () => {
  test("does not add or remove newline tokens", async () => {
    const input = [
      "<!DOCTYPE html>",
      "<html>",
      "<head>",
      "  <meta charset=\"UTF-8\">",
      "  <title>Example</title>",
      "</head>",
      "<body>",
      "",
      "<h1>Example</h1>",
      "",
      "<ul>",
      "  <li>Example 1</li>",
      "  <li>Example 2</li>",
      "</ul>",
      "",
      "</body>",
      "</html>",
      ""
    ].join("\n"); // explicit \n so we can verify exact tokens

    const doc = await vscode.workspace.openTextDocument({
      language: "html",
      content: input
    });

    await vscode.window.showTextDocument(doc);

    const before = doc.getText();
    await vscode.commands.executeCommand("editor.action.formatDocument");
    const after = doc.getText();

    assert.deepStrictEqual(
      newlineTokens(after),
      newlineTokens(before),
      "Formatter must not add/remove newline tokens"
    );
  });
}); 
