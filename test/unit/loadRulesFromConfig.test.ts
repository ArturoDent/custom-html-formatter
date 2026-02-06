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


// export function loadRulesFromConfig( raw: any ): FormatterRules | undefined {
//   if ( !raw || typeof raw !== "object" ) return undefined;

//   // VS Code returns an empty proxy object for unset object-valued settings.
//   // An empty object is treated as "no rules configured".
//   if ( Object.keys( raw ).length === 0 ) return undefined;

//   //       If rules exist at all:
//   // Formatting must know how wide an indent is
//   // → indentSize always resolves to a number

//   // Suppressing indentation under tags is optional
//   // If the user didn’t specify it, nothing is suppressed → noIndentUnder: []

//   return {
//     noIndentUnder: Array.isArray( raw.noIndentUnder )
//       ? raw.noIndentUnder.map( String )
//       : [],

//     // Default indentation size is applied only when rules exist.
//     indentSize: typeof raw.indentSize === "number"
//       ? raw.indentSize
//       : DEFAULT_RULES.indentSize
//   };
// }