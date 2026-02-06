const fs = require( "fs" );
const path = require( "path" );

const src = path.resolve( __dirname, "../test/integration/fixtures" );
const dest = path.resolve( __dirname, "../out/test/integration/fixtures" );

function copyRecursive( srcDir, destDir ) {
  fs.mkdirSync( destDir, { recursive: true } );

  for ( const entry of fs.readdirSync( srcDir, { withFileTypes: true } ) ) {
    const srcPath = path.join( srcDir, entry.name );
    const destPath = path.join( destDir, entry.name );

    if ( entry.isDirectory() ) {
      copyRecursive( srcPath, destPath );
    } else {
      fs.copyFileSync( srcPath, destPath );
    }
  }
}

copyRecursive( src, dest );

console.log( "✔ Fixtures copied." );
