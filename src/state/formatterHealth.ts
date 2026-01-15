import * as vscode from "vscode";
import { getLastRuleImpacts, summarizeRuleImpacts } from "../core/ruleImpact";
import { getLastRunMode, getLastDryRunImpacts, type FormatterLastRunMode } from './formatRunState';
import { getLastFormatterState, getCurrentConfigs } from './formatterState';

export interface FormatterHealthSnapshot {
  version: 1;

  status: {
    customFormatterConfigured: boolean;
    builtinFormatterDisabled: boolean;
    writeScope: "global" | "workspace" | "unset";
    lastRunMode: FormatterLastRunMode;
  };

  configuration: {
    indentUnit: string;
    noIndentUnder: string[];
    layoutPreserving: boolean;
  };

  lastRun?: {
    fileName: string;
    timestamp: number; // epoch ms
    mode: FormatterLastRunMode;
    linesAffected: number;
    ruleImpacts: Array<{
      rule: string;
      lines: number;
    }>;
  };

  notes: string[];
}


export function collectFormatterHealth(): FormatterHealthSnapshot {

  const formatterState = getLastFormatterState();
  const configs = getCurrentConfigs();

  const snapshot: FormatterHealthSnapshot = {
    version: 1,

    status: {
      // customFormatterConfigured: isFormatterActive(),
      customFormatterConfigured: formatterState?.startsWith( "active" ) ?? false,
      builtinFormatterDisabled: isBuiltinDisabled(),
      writeScope: getWriteScope(),
      lastRunMode: getLastRunMode()
    },

    configuration: {
      indentUnit: getIndentUnit(),
      // noIndentUnder: getNoIndentUnder(),
      noIndentUnder: configs?.rules?.noIndentUnder ?? [],
      layoutPreserving: true,
    },

    lastRun: getLastRunSnapshot(),

    notes: [], // placeholder
  };

  // Step 2: derive notes *from the completed snapshot*
  snapshot.notes = computeHealthNotes( snapshot );

  return snapshot;
}

// Helpers --------------------------------------------------------------------

function isFormatterActive(): boolean {
  const editor = vscode.window.activeTextEditor;
  if ( !editor ) return false;

  const doc = editor.document;
  if ( doc.languageId !== "html" ) return false;

  const defaultFormatter = vscode.workspace.getConfiguration( '', { languageId: "html" } ).get( 'editor.defaultFormatter' );
  return defaultFormatter === "ArturoDent.custom-html-formatter";
}


function isBuiltinDisabled(): boolean {
  const editor = vscode.window.activeTextEditor;
  if ( !editor ) return false;

  const doc = editor.document;
  const config = vscode.workspace.getConfiguration( "html", doc.uri );

  // Built‑in formatter is effectively disabled if formatting is delegated
  return config.get<boolean>( "format.enable" ) === false;
}

// this looks at where rules are actually written, not the setting preference
function getWriteScope(): "global" | "workspace" | "unset" {

  const config = vscode.workspace.getConfiguration( "customHtmlFormatter" );

  const inspect = config.inspect( "rules" );
  if ( !inspect ) return "unset";

  if ( inspect.workspaceValue !== undefined ) return "workspace";
  if ( inspect.globalValue !== undefined ) return "global";

  return "unset";
}

// this is the indentation as found in editor.options, not the rules.indentSize
function getIndentUnit(): string {
  const editor = vscode.window.activeTextEditor;
  if ( !editor ) return renderIndentUnit( "  " );

  const options = editor.options;

  if ( options.insertSpaces ) {
    const size = typeof options.tabSize === "number" ? options.tabSize : 2;
    return renderIndentUnit( " ".repeat( size ) );
  }

  return renderIndentUnit( "\t" );
}


function renderIndentUnit( unit: string ): string {
  if ( unit === "\t" ) {
    return "\\t (tab)";
  }

  if ( /^ +$/.test( unit ) ) {
    return `"${unit}" (${unit.length} spaces)`;
  }

  return JSON.stringify( unit );
}



// "customHtmlFormatter.rules": {
//   "noIndentUnder": [
//     "html",
//     "body"
//   ],
//     "indentSize": 2;
// }
function getNoIndentUnder(): string[] {
  const config = vscode.workspace.getConfiguration( "customHtmlFormatter.rules" );
  return config.get<string[]>( "noIndentUnder", [] );
}


function getLastRunSnapshot():
  | {
    fileName: string,
    timestamp: number;
    mode: FormatterLastRunMode;
    linesAffected: number;
    ruleImpacts: Array<{ rule: string; lines: number; }>;
  }
  | undefined {

  const impacts = getLastRuleImpacts();
  const mode = getLastRunMode();

  if ( !impacts.length || !mode ) return undefined;

  const summary = summarizeRuleImpacts( impacts );

  return {
    fileName: impacts[0].fileName,
    timestamp: Date.now(),
    mode, // "format" | "dryRun"
    linesAffected: summary.reduce( ( n, r ) => n + r.count, 0 ),
    ruleImpacts: summary.map( r => ( {
      rule: r.rule,
      lines: r.count,
    } ) ),
  };
}


function computeHealthNotes(
  snapshot: FormatterHealthSnapshot
): string[] {
  const notes: string[] = [];

  if ( snapshot.status.customFormatterConfigured ) {
    notes.push(
      "Custom HTML Formatter is configured as the default formatter for HTML files."
    );
  }

  if ( !snapshot.status.builtinFormatterDisabled ) {
    notes.push(
      "Built-in HTML formatter may override formatting results."
    );
  }

  if ( !snapshot.lastRun ) {
    notes.push(
      "No formatter run has occurred in this session."
    );
  }

  if (
    snapshot.lastRun &&
    snapshot.lastRun.linesAffected === 0
  ) {
    notes.push(
      "Last run produced no indentation changes."
    );
  }

  const dryRunImpacts = getLastDryRunImpacts();

  if ( snapshot.status.lastRunMode === "format" && dryRunImpacts ) {
    notes.push( "A dry run was performed after the last actual format." );
  }


  if ( !notes.length ) {
    notes.push(
      "Formatter is active and configured correctly."
    );
  }

  return notes;
}
