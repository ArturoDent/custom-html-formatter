import * as assert from "assert";

suite( "unit test harness", () => {
  test( "runs a basic assertion", () => {
    assert.strictEqual( 1 + 1, 2 );
  } );
} );
