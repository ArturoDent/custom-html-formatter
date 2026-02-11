import * as path from "path";

// ESM-safe Mocha import
const MochaModule = require( "mocha" );
const Mocha = MochaModule.default || MochaModule;

// ESM-safe glob import (glob v10+)
const globModule = require( "glob" );
const glob = globModule.glob || globModule;

export async function run(): Promise<void> {
  console.log( "DEBUG TEST RUNNER LOADED" );

  const mocha = new Mocha( {
    ui: "tdd",
    color: true,
    slow: 300,
    timeout: 0
  } );

  const testsRoot = path.resolve( __dirname, ".." );

  try {
    // glob v10+ returns a Promise
    // const files: string[] = await glob( "**/*.test.js", { cwd: testsRoot } );
    const files: string[] = await glob( "integration/**/*.test.js", { cwd: testsRoot } );

    files.forEach( f => {
      mocha.addFile( path.resolve( testsRoot, f ) );
    } );

    await new Promise<void>( ( resolve, reject ) => {
      mocha.run( ( failures: any ) => {
        if ( failures > 0 ) {
          reject( new Error( `${failures} tests failed.` ) );
        } else {
          resolve();
        }
      } );
    } );
  } catch ( err ) {
    console.error( "Error running tests:", err );
    throw err;
  }
}
