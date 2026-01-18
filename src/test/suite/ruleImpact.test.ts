import * as assert from "node:assert";
import { getDocumentChanges } from "../../core/formatter";
import type { FormatterRules } from "../../core/rules";
import { summarizeRuleImpacts, type RuleImpact, type RuleImpactSummary } from "../../core/ruleImpact";

function impactMap( summaries: RuleImpactSummary[] ) {
  return Object.fromEntries(
    summaries.map( s => [s.rule, s.count] )
  );
}

const rules: FormatterRules = {
  noIndentUnder: ["html", "body"],
  indentSize: 2
};

suite( "Rule Impact Counts", () => {

  test( "no expected changes", () => {
    const input = `
<!DOCTYPE html>
<html>
<head>
  <title>Example</title>
</head>
<body>
<h1>Example</h1>
</body>
</html>
`.trim();

    const result = getDocumentChanges( input, rules );
    const summaries = summarizeRuleImpacts( result.ruleImpacts );

    assert.deepStrictEqual( impactMap( summaries ), {} );
  } );

  test( "body changes only", () => {
    const input = `
<!DOCTYPE html>
<html>
<head>
  <title>Example</title>
</head>
<body>

  <div>
    <p>Indented incorrectly</p>
  </div>

</body>
</html>
`.trim();

    const result = getDocumentChanges( input, rules );
    const summaries = summarizeRuleImpacts( result.ruleImpacts );

    assert.deepStrictEqual( impactMap( summaries ), {
      "noIndentUnder(body)": 1
    } );
  } );

  test( "body and html changes expected", () => {
    const input = `
<!DOCTYPE html>
<html>
  <head>
    <title>Example</title>
    </head>
  <body>

      <div>
      <p>Indented incorrectly</p>
    </div>
    
    <div>
      <p>Indented incorrectly</p>
         </div>
  
            <div>
              <p>Indented incorrectly</p>
            </div>

  </body>
</html>
`.trim();

    const result = getDocumentChanges( input, rules );
    const summaries = summarizeRuleImpacts( result.ruleImpacts );

    assert.deepStrictEqual( impactMap( summaries ), {
      "noIndentUnder(html)": 2,
      "noIndentUnder(body)": 3
    } );
  } );

} );
