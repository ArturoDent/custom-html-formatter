import * as assert from "assert";
import * as vscode from "vscode";
import { loadFixture } from "../helpers/fixtures";
import { setRules, setHtmlFormatter, setAllConfigs } from "../helpers/updateSettings";
import { callProviderDirectly } from "../helpers/callProvider";

suite( "Provider Return Contract", () => {

  test( "no rules → provider returns undefined", async () => {
    // await setRules( undefined );
    // await setHtmlFormatter( "ArturoDent.custom-html-formatter" );
    await setAllConfigs( "ArturoDent.custom-html-formatter", undefined );

    const { input } = await loadFixture( "provider-contract", "no-rules" );
    const doc = await vscode.workspace.openTextDocument( { language: "html", content: input } );

    const edits = await callProviderDirectly( doc );

    assert.strictEqual( edits, undefined );
  } );

  test( "rules exist but no changes → provider returns undefined", async () => {
    // await setRules( { indentSize: 2, noIndentUnder: ["html"] } );
    // await setHtmlFormatter( "ArturoDent.custom-html-formatter" );
    await setAllConfigs( "ArturoDent.custom-html-formatter", { indentSize: 2, noIndentUnder: ["html"] } );

    const { input } = await loadFixture( "provider-contract", "no-change" );
    const doc = await vscode.workspace.openTextDocument( { language: "html", content: input } );

    const edits = await callProviderDirectly( doc );

    assert.strictEqual( edits, undefined );
  } );

  test( "rules exist and changes occur → provider returns one full-range edit", async () => {
    // await setRules( { indentSize: 2, noIndentUnder: ["html", "body"] } );
    // await setHtmlFormatter( "ArturoDent.custom-html-formatter" );
    await setAllConfigs( "ArturoDent.custom-html-formatter", { indentSize: 2, noIndentUnder: ["html"] } );

    const { input } = await loadFixture( "provider-contract", "needs-change" );
    const doc = await vscode.workspace.openTextDocument( { language: "html", content: input } );

    const edits = await callProviderDirectly( doc );

    assert.ok( Array.isArray( edits ) );
    assert.strictEqual( edits!.length, 1 );

    const fullRange = new vscode.Range(
      doc.positionAt( 0 ),
      doc.positionAt( doc.getText().length )
    );

    assert.deepStrictEqual( edits![0].range, fullRange );
  } );

} );