// // helpers/runFormatter.ts
// // import { FixtureConfig, FormatterResult } from "../types/formatter";
// // import { runJsBeautify } from "./passes/runJsBeautify";
// // import { runDefaultFormatter } from "./passes/runDefaultFormatter";
// // import { runCustomRules } from "./passes/runCustomRules";
// // import { normalizeEOL } from "./utils/normalizeEOL";

// // types/formatter.ts
// export interface FixtureConfig {
//   description?: string;
//   indentSize?: number;
//   defaultFormatter?: string;
//   enableJsBeautify?: boolean;
//   enableCustomFormatter?: boolean;
//   rules?: string[];         // merged, deduped list
//   noIndentUnder?: string[]; // merged, deduped list
//   [key: string]: any;
// }

// export interface FormatterResult {
//   text: string;
//   diagnostics: {
//     passes: string[];            // e.g., ["js-beautify","default-formatter","custom-rules"]
//     ruleApplications: Record<string, number>; // how many times each rule ran/changed
//     elapsedMs: number;
//   };
// }

// export async function runFormatter( input: string, config: FixtureConfig ): Promise<FormatterResult> {
//   const start = Date.now();
//   const diagnostics = {
//     passes: [] as string[],
//     ruleApplications: {} as Record<string, number>,
//     elapsedMs: 0
//   };

//   // Work on a copy
//   let text = input;

//   // 1. Optional: run js-beautify first if enabled
//   if ( config.enableJsBeautify ) {
//     diagnostics.passes.push( "js-beautify" );
//     text = await runJsBeautify( text, {
//       indentSize: config.indentSize,
//       defaultFormatter: config.defaultFormatter,
//       // pass through any other options needed
//     } );
//   }

//   // 2. Optional: run a default formatter (mode-level formatter)
//   //    This is useful if you have a named defaultFormatter that is not js-beautify
//   if ( config.defaultFormatter && !config.enableJsBeautify ) {
//     diagnostics.passes.push( `default:${config.defaultFormatter}` );
//     text = await runDefaultFormatter( text, {
//       name: config.defaultFormatter,
//       indentSize: config.indentSize
//     } );
//   }

//   // 3. Optional: run your custom HTML formatter
//   if ( config.enableCustomFormatter ) {
//     diagnostics.passes.push( "custom-formatter" );
//     const { text: after, ruleApplications } = await runCustomRules( text, {
//       rules: config.rules || [],
//       noIndentUnder: config.noIndentUnder || [],
//       indentSize: config.indentSize
//     } );

//     text = after;
//     // merge rule application counts
//     for ( const k of Object.keys( ruleApplications ) ) {
//       diagnostics.ruleApplications[k] = ( diagnostics.ruleApplications[k] || 0 ) + ruleApplications[k];
//     }
//   }

//   // 4. Final normalization: EOL, trailing whitespace, stable attribute ordering if needed
//   text = normalizeEOL( text );
//   // optional: stable attribute ordering, trim trailing spaces, ensure final newline
//   if ( !text.endsWith( "\n" ) ) text += "\n";

//   diagnostics.elapsedMs = Date.now() - start;

//   return { text, diagnostics };
// }