import * as assert from "node:assert";
import * as vscode from "vscode";
import { setHtmlFormatter, setRules, setRulesToDefaults, setAllConfigs } from "../helpers/updateSettings";


function newlineTokens( s: string ): string[] {
  return s.match( /\r\n|\n/g ) ?? [];
}

suite( "\nCustom HTML Formatter newline regression)", function () {
  this.timeout( 0 ); // ⬅ disable timeout entirely

  setup( async () => {
    // await setRulesToDefaults();
    // await setHtmlFormatter( "ArturoDent.custom-html-formatter" );
    await setAllConfigs( "ArturoDent.custom-html-formatter", { indentSize: 2, noIndentUnder: ["html"] } );
  } );

  teardown( async () => {
    // await setHtmlFormatter( undefined );
    // await setRules( undefined );
    await setAllConfigs( undefined, undefined );

  } );

  test( "does not add or remove newline tokens", async () => {
    const input = [
      "<!DOCTYPE html>",
      "<html>",
      "<head>",
      "  <meta charset=\"UTF-8\">",
      "  <title>Custom HTML Formatter newline regression: does not add or remove newline tokens</title>",
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
    ].join( "\n" ); // explicit \n so we can verify exact tokens

    const doc = await vscode.workspace.openTextDocument( {
      language: "html",
      content: input
    } );

    await vscode.window.showTextDocument( doc );

    const before = doc.getText();
    await vscode.commands.executeCommand( "editor.action.formatDocument" );
    const after = doc.getText();

    // enforce not adding or removing internal newline tokens
    // since vscode will enforce a final newline or not depending on user's setting
    assert.deepStrictEqual(
      newlineTokens( stripFinalNewline( after ) ),
      newlineTokens( stripFinalNewline( before ) ),
      "Formatter must not add/remove newline tokens"
    );
  } );
} );

function stripFinalNewline( s: string ): string {
  return s.replace( /(\r?\n)$/, "" );
}