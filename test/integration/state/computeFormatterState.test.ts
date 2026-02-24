import * as assert from "assert";

import { computeFormatterState } from "../../../src/state/formatterState";
import { setDefaultHtmlFormatter } from "../../../src/core/configs";

suite( "computeFormatterState()", async () => {



  test( "returns 'customFormatterEnabledNotDefault' when enabled = false", async () => {
    // const state = computeFormatterState( "vscode.html-language-features", null );
    await setDefaultHtmlFormatter( "ArturoDent.custom-html-formatter" );

    const state = await computeFormatterState( false, null );
    assert.strictEqual( state, "customFormatterEnabledNotDefault" );
  } );

  test( "returns 'builtin' when default formatter = builtin", async () => {
    await setDefaultHtmlFormatter( "vscode.html-language-features" );
    const state = await computeFormatterState( true, null );
    assert.strictEqual( state, "builtin" );
  } );


  test( "returns 'activeRules' when noIndentUnder rule exists and custom formatter matches", async () => {
    await setDefaultHtmlFormatter( "ArturoDent.custom-html-formatter" );

    const state = await computeFormatterState( true, {
      noIndentUnder: ["html"]
    } );
    assert.strictEqual( state, "activeRules" );
  } );

  test( "returns 'activeNoIndentUnder' when rule exists but not 'noIndentUnder' and custom formatter matches", async () => {
    await setDefaultHtmlFormatter( "ArturoDent.custom-html-formatter" );

    const state = await computeFormatterState( true, {
      index: 2
    } );
    assert.strictEqual( state, "activeNoIndentUnder" );
  } );

  test( "returns 'activeNoIndentUnder' when rule exists but '!noIndentUnder.length' and custom formatter matches", async () => {
    await setDefaultHtmlFormatter( "ArturoDent.custom-html-formatter" );

    const state = await computeFormatterState( true, {
      noIndentUnder: []
    } );
    assert.strictEqual( state, "activeNoIndentUnder" );
  } );

  test( "returns 'activeNoRules' when there are no rules and custom formatter matches", async () => {
    await setDefaultHtmlFormatter( "ArturoDent.custom-html-formatter" );

    const state = await computeFormatterState( true, {} );
    assert.strictEqual( state, "activeNoRules" );
  } );

} );