import * as assert from "node:assert";
import { summarizeRuleImpacts } from "../../src/core/ruleImpact";

describe( "recordRuleImpact()", () => {
  it( "empty changes → empty impacts", () => {
    const impacts = summarizeRuleImpacts( [] );
    assert.deepStrictEqual( impacts, [] );
  } );

  it( "groups impacts by rule", () => {
    const impacts = summarizeRuleImpacts( [
      { line: 1, delta: -2, rule: "noIndentUnder" },
      { line: 2, delta: -2, rule: "noIndentUnder" }
    ] );

    assert.strictEqual( impacts.length, 1 );
    assert.strictEqual( impacts[0].rule, "noIndentUnder" );
  } );
} );

// export const ruleImpacts: RuleImpact[] = [];
// export function recordRuleImpact(
//   rule: string,
//   delta: number,
//   line: number
// ): void {
//   if ( delta !== 0 ) {
//     ruleImpacts.push( { rule, delta, line } );
//   }
// }
