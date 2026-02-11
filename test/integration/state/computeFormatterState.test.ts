import * as assert from "assert";

import { computeFormatterState } from "../../../src/state/formatterState";

suite( "computeFormatterState()", () => {
  test( "returns 'builtin' when rules = null", () => {
    const state = computeFormatterState( "vscode.html-language-features", null );
    assert.strictEqual( state, "builtin" );
  } );

  // test( "returns disabled when default formatter is not this extension", () => {
  //   const state = computeFormatterState( "some.other.formatter", { noIndentUnder: ["html"] } );
  //   assert.strictEqual( state, false );
  // } );

  test( "returns 'noFormatter' when default formatter is not this extension", () => {
    const state = computeFormatterState( null, { noIndentUnder: ["html"] } );
    assert.strictEqual( state, "noFormatter" );
  } );


  test( "returns 'activeRules' when noIndentUnder rule exists and custom formatter matches", () => {
    const state = computeFormatterState( "ArturoDent.custom-html-formatter", {
      noIndentUnder: ["html"]
    } );
    assert.strictEqual( state, "activeRules" );
  } );

  test( "returns 'activeNoIndentUnder' when rule exists but not 'noIndentUnder' and custom formatter matches", () => {
    const state = computeFormatterState( "ArturoDent.custom-html-formatter", {
      index: 2
    } );
    assert.strictEqual( state, "activeNoIndentUnder" );
  } );

  test( "returns 'activeNoIndentUnder' when rule exists but '!noIndentUnder.length' and custom formatter matches", () => {
    const state = computeFormatterState( "ArturoDent.custom-html-formatter", {
      noIndentUnder: []
    } );
    assert.strictEqual( state, "activeNoIndentUnder" );
  } );

  test( "returns 'activeNoRules' when there are no rules and custom formatter matches", () => {
    const state = computeFormatterState( "ArturoDent.custom-html-formatter", {} );
    assert.strictEqual( state, "activeNoRules" );
  } );

} );