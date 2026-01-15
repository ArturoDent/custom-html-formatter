import * as vscode from "vscode";
import type { FormatterHealthSnapshot } from './formatterHealth';
import { getHealthOutputChannel } from '../vscode/output';


export function renderHealthSnapshot( snapshot: FormatterHealthSnapshot ): void {

  const channel = getHealthOutputChannel();
  channel.clear();

  channel.appendLine( "Custom HTML Formatter — Health" );
  channel.appendLine( "─────────────────────────────" );
  channel.appendLine( "" );

  renderSection( channel, "Status", snapshot.status );
  renderSection( channel, "Configuration", snapshot.configuration );

  if ( snapshot.lastRun ) {
    renderLastRun( channel, snapshot.lastRun );
  }
  else {
    channel.appendLine( "Last Run" );
    channel.appendLine(
      "  No formatter run recorded in this session."
    );
    channel.appendLine( "" );
  }

  if ( snapshot.notes.length ) {
    channel.appendLine( "Notes" );
    for ( const note of snapshot.notes ) {
      channel.appendLine( `  ${note}` );
    }
    channel.appendLine( "" );
  }

  channel.show( true );
}


function renderSection( channel: vscode.OutputChannel, title: string, entries: Record<string, string | boolean | string[]> ): void {

  channel.appendLine( title );

  for ( const [key, value] of Object.entries( entries ) ) {
    if ( Array.isArray( value ) ) {
      channel.appendLine( `  ${key}: ${value.join( ", " ) || "(none)"}` );
    } else {
      channel.appendLine( `  ${key}: ${String( value )}` );
    }
  }

  channel.appendLine( "" );
}

// NonNullable because lastRun is guaranteed to exist in caller renderHealthSnapshot() guard
function renderLastRun( channel: vscode.OutputChannel, lastRun: NonNullable<FormatterHealthSnapshot["lastRun"]> ): void {

  channel.appendLine( "Last Run" );

  channel.appendLine( `  ${lastRun.fileName}` );

  channel.appendLine(
    `  Timestamp: ${new Date( lastRun.timestamp ).toLocaleString()}`
  );
  channel.appendLine( `  Mode: ${lastRun.mode}` );
  channel.appendLine( `  Lines affected: ${lastRun.linesAffected}` );

  if ( lastRun.ruleImpacts.length ) {
    channel.appendLine( "  Rules involved:" );
    for ( const impact of lastRun.ruleImpacts ) {
      channel.appendLine(
        `    ${impact.rule}: ${impact.lines} lines`
      );
    }
  } else {
    channel.appendLine( "  Rules involved: none" );
  }

  channel.appendLine( "" );
}
