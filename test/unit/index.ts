import * as path from "path";
import * as glob from "glob";

const MochaModule = require( "mocha" );
const Mocha = MochaModule.default || MochaModule;

const mocha = new Mocha( {
  ui: "tdd",
  color: true
} );

const testsRoot = __dirname;

glob.sync( "**/*.test.js", { cwd: testsRoot } ).forEach( file => {
  mocha.addFile( path.join( testsRoot, file ) );
} );

mocha.run( ( failures: number ) => {
  process.exitCode = failures ? 1 : 0;
} );
