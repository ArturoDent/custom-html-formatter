// helpers/loadFixture.ts
import * as fs from "node:fs";
import * as path from "node:path";

export interface FixtureDataRaw {
  input: string;
  expected: string;
  subfolderRawConfig?: any;
  caseRawConfig?: any;
  modeRootRawConfig?: any;
  mergedConfig?: any;
}

export function readJsonIfExists( p: string ) {
  if ( !fs.existsSync( p ) ) return undefined;
  try { return JSON.parse( fs.readFileSync( p, "utf8" ) ); } catch { return undefined; }
}

export function loadFixtureFiles( mode: string, caseName: string, subfolder: string ): FixtureDataRaw {
  const base = path.join( __dirname, "..", "modes", mode, "fixtures", caseName, subfolder );
  const input = fs.readFileSync( path.join( base, "input.html" ), "utf8" );
  const expected = fs.readFileSync( path.join( base, "expected.html" ), "utf8" );

  const subfolderCfg = readJsonIfExists( path.join( base, "config.json" ) );
  const caseCfg = readJsonIfExists( path.join( __dirname, "..", "modes", mode, "fixtures", caseName, "config.json" ) );
  const modeRootCfg = readJsonIfExists( path.join( __dirname, "..", "modes", mode, "config.json" ) );

  return {
    input,
    expected,
    subfolderRawConfig: subfolderCfg,
    caseRawConfig: caseCfg,
    modeRootRawConfig: modeRootCfg
  };
}