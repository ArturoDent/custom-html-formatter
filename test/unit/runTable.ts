type TestCase<TInput, TExpected> = {
  name: string;
  input: TInput;
  expected: TExpected;
};

export function runTable<TInput, TExpected>(
  cases: readonly TestCase<TInput, TExpected>[],
  run: ( input: TInput ) => TExpected,
  assert: ( actual: TExpected, expected: TExpected ) => void
) {
  for ( const c of cases ) {
    it( c.name, () => {
      const actual = run( c.input );
      assert( actual, c.expected );
    } );
  }
}
