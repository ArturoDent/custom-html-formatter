// // tests/modeMatrix.test.ts
// import * as fs from "node:fs";
// import * as path from "node:path";
// import { loadFixtureFiles } from "../helpers/loadFixtures";
// import { mergeConfigs } from "../helpers/fixtureConfigs";
// // import { runFormatter } from "../helpers/runFormatter";
// // import { assertMinimalDiff } from "../helpers/assertMinimalDiff";

// const MODES_ROOT = path.join( __dirname, "..", "modes" );

// function discoverModes(): string[] {
//   return fs.readdirSync( MODES_ROOT ).filter( m => fs.statSync( path.join( MODES_ROOT, m ) ).isDirectory() );
// }

// function discoverCases( mode: string ): string[] {
//   const fixturesRoot = path.join( MODES_ROOT, mode, "fixtures" );
//   if ( !fs.existsSync( fixturesRoot ) ) return [];
//   return fs.readdirSync( fixturesRoot ).filter( e => fs.statSync( path.join( fixturesRoot, e ) ).isDirectory() );
// }

// function discoverSubfolders( mode: string, caseName: string ): string[] {
//   const caseRoot = path.join( MODES_ROOT, mode, "fixtures", caseName );
//   return fs.readdirSync( caseRoot ).filter( e => fs.statSync( path.join( caseRoot, e ) ).isDirectory() );
// }

// describe( "Mode Matrix", () => {
//   const modes = discoverModes();

//   for ( const mode of modes ) {
//     describe( `Mode: ${mode}`, () => {
//       const cases = discoverCases( mode );

//       // Preload all fixtures for this mode
//       const fixturesData: { caseName: string; subfolder: string; data: ReturnType<typeof loadFixtureFiles>; mergedConfig: any; }[] = [];

//       for ( const caseName of cases ) {
//         const subs = discoverSubfolders( mode, caseName );
//         for ( const sub of subs ) {
//           const data = loadFixtureFiles( mode, caseName, sub );
//           const merged = mergeConfigs( data.modeRootRawConfig, data.caseRawConfig, data.subfolderRawConfig );
//           data.mergedConfig = merged;
//           fixturesData.push( { caseName, subfolder: sub, data, mergedConfig: merged } );
//         }
//       }

//       for ( const entry of fixturesData ) {
//         const shortDesc = ( entry.mergedConfig.description || "" ).split( "\n" )[0].slice( 0, 80 );
//         it( `Case: ${entry.caseName} / ${entry.subfolder} — ${mode} ${shortDesc}`, async () => {
//           const { input, expected } = entry.data;
//           const cfg = entry.mergedConfig;

//           const actual = await runFormatter( input, { mode, ...cfg } );

//           assertMinimalDiff( actual, expected, {
//             mode,
//             fixture: `${entry.caseName}/${entry.subfolder}`,
//             description: cfg.description,
//             mergedConfig: cfg
//           } );
//         } );
//       }
//     } );
//   }
// } );