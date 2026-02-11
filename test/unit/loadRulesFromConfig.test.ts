import * as assert from "node:assert";
import { loadRulesFromConfig } from "../../src/core/rules";

describe( "loadRulesFromConfig()", () => {
  it( "returns undefined for no configs", () => {
    assert.deepStrictEqual( loadRulesFromConfig( null ), undefined );
  } );

  it( "normalizes noIndentUnder to array", () => {
    const rules = loadRulesFromConfig( { noIndentUnder: "html" } )!;  // assert non-null
    assert.deepStrictEqual( rules.noIndentUnder, ["html"] );
  } );

  it( "returns null for invalid rule types", () => {
    assert.deepStrictEqual( loadRulesFromConfig( { noIndentUnder: 123 } ), { indentSize: 2, noIndentUnder: [] } );
  } );
} );