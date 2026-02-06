import * as assert from "assert";

import { getDocumentChanges } from "../../src/core/formatter";

describe( "collectIndentation()", () => {
  it( "no rules → no indentation changes", () => {
    const result = getDocumentChanges( "<html><body></body></html>", { noIndentUnder: [], indentSize: 2 } );
    assert.deepStrictEqual( result.ruleImpacts, [] );
  } );

  it( "noIndentUnder applies only to direct children", () => {
    const html = "<html>\n\t<body>\n\t\t<p></p>\n\t</body>\n</html>";
    const rules = {
      indentSize: 2,
      noIndentUnder: ["html"],
    } as any;

    const result = getDocumentChanges( html, rules );

    assert.ok(
      result.ruleImpacts.some( i => i.rule.startsWith( "noIndentUnder" ) ),
      "expected at least one noIndentUnder impact"
    );
  } );

} );

