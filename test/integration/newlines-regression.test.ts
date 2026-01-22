import * as assert from "node:assert";
import * as vscode from "vscode";
import { DEFAULT_RULES } from '../../src/core/rules';


function newlineTokens( s: string ): string[] {
  return s.match( /\r\n|\n/g ) ?? [];
}

suite( "\nCustom HTML Formatter newline regression)", function () {
  this.timeout( 0 ); // ⬅ disable timeout entirely

  setup( async () => {
    await vscode.workspace
      .getConfiguration( "customHtmlFormatter" )
      .update( "rules", DEFAULT_RULES, vscode.ConfigurationTarget.Workspace );

    // Wait for extension to register formatter 
    // await updateFormatter();

    await vscode.workspace.getConfiguration()
      .update( "[html]", { "editor.defaultFormatter": "ArturoDent.custom-html-formatter" },
        vscode.ConfigurationTarget.Workspace
      );
  } );

  teardown( async () => {
    await vscode.workspace.getConfiguration().update(
      "[html]",
      undefined,
      vscode.ConfigurationTarget.Workspace
    );

    await vscode.workspace
      .getConfiguration( "customHtmlFormatter" )
      .update( "rules", undefined, vscode.ConfigurationTarget.Workspace );
  } );

  test( "does not add or remove newline tokens", async () => {
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