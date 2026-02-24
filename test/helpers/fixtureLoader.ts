import * as fs from "fs";
import * as path from "path";

export interface FixtureCase {
  name: string;          // e.g. "case-basic" or "default"
  input: string;
  expected: string;
  fullPath: string;      // folder path for debugging
}

export interface FixtureGroup {
  name: string;          // e.g. "no-rules"
  cases: FixtureCase[];
}

export function loadFixtureGroups( rootDir: string ): FixtureGroup[] {
  const groups: FixtureGroup[] = [];

  for ( const groupName of fs.readdirSync( rootDir ) ) {
    const groupFolder = path.join( rootDir, groupName );
    if ( !fs.statSync( groupFolder ).isDirectory() ) continue;

    const entries = fs.readdirSync( groupFolder );
    const cases: FixtureCase[] = [];

    // Case 1: direct input.html + expected.html
    if ( entries.includes( "input.html" ) && entries.includes( "expected.html" ) ) {
      cases.push( {
        name: "default",
        input: fs.readFileSync( path.join( groupFolder, "input.html" ), "utf8" ),
        expected: fs.readFileSync( path.join( groupFolder, "expected.html" ), "utf8" ),
        fullPath: groupFolder
      } );
    }

    // Case 2: nested case folders
    for ( const entry of entries ) {
      const caseFolder = path.join( groupFolder, entry );
      if ( !fs.statSync( caseFolder ).isDirectory() ) continue;

      cases.push( {
        name: entry,
        input: fs.readFileSync( path.join( caseFolder, "input.html" ), "utf8" ),
        expected: fs.readFileSync( path.join( caseFolder, "expected.html" ), "utf8" ),
        fullPath: caseFolder
      } );
    }

    groups.push( { name: groupName, cases } );
  }

  return groups;
}

export function normalize( text: string ): string {
  return text.replace( /\r\n/g, "\n" ).replace( /\s+$/, "\n" );
}