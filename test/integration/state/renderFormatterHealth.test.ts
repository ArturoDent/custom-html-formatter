import * as assert from "assert";
import { renderFormatterHealthToString } from "../../../src/state/formatterHealthOutput";


suite( "formatterHealth.render()", () => {
  test( "renders disabled state", () => {
    const text = renderFormatterHealthToString( {
      version: 1,
      status: {
        customFormatterConfigured: false,
        builtinFormatterDisabled: false,
        writeScope: "unset",
        lastRunMode: "format"
      },
      configuration: {
        indentUnit: '"  " (2 spaces)',
        noIndentUnder: [],
        layoutPreserving: true
      },
      lastRun: undefined,
      notes: ["Missing rules"]
    } );

    assert.match( text, /(none)/ );
    assert.match( text, /Missing rules/ );
  } );
} );

// `Custom HTML Formatter — Health
// ─────────────────────────────

// Status
//   customFormatterConfigured: false
//   builtinFormatterDisabled: false
//   writeScope: unset
//   lastRunMode: format

// Configuration
//   indentUnit: "  " (2 spaces)
//   noIndentUnder: (none)
//   layoutPreserving: true

// Last Run
//   No formatter run recorded in this session.

// Notes
//   Missing rules
// `;