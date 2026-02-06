import * as fs from "fs";
import * as path from "path";

export async function loadFixture( group: string, name: string ) {
  const root = path.resolve( __dirname, "../fixtures", group, name );
  const input = fs.readFileSync( path.join( root, "input.html" ), "utf8" );
  const expected = fs.readFileSync( path.join( root, "expected.html" ), "utf8" );
  return { input, expected };
}