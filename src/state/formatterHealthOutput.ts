import * as vscode from "vscode";
import type { FormatterHealthSnapshot } from './formatterHealth';
import { getHealthOutputChannel } from '../ui/output';


export function renderHealthSnapshot( snapshot: FormatterHealthSnapshot ): void {
  const channel = getHealthOutputChannel();
  channel.clear();

  const text = renderFormatterHealthToString( snapshot );
  channel.append( text );

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


export function renderFormatterHealthToString( snapshot: FormatterHealthSnapshot ): string {

  const lines: string[] = [];

  lines.push( "Custom HTML Formatter — Health" );
  lines.push( "─────────────────────────────" );
  lines.push( "" );

  // Status
  lines.push( "Status" );
  for ( const [key, value] of Object.entries( snapshot.status ) ) {
    lines.push( `  ${key}: ${String( value )}` );
  }
  lines.push( "" );

  // Configuration
  lines.push( "Configuration" );
  for ( const [key, value] of Object.entries( snapshot.configuration ) ) {
    if ( Array.isArray( value ) ) {
      lines.push( `  ${key}: ${value.join( ", " ) || "(none)"}` );
    } else {
      lines.push( `  ${key}: ${String( value )}` );
    }
  }
  lines.push( "" );

  // Last Run
  if ( snapshot.lastRun ) {
    lines.push( "Last Run" );
    lines.push( `  Timestamp: ${snapshot.lastRun.timestamp}` );
    lines.push( `  Mode: ${snapshot.lastRun.mode}` );
    lines.push( `  Lines affected: ${snapshot.lastRun.linesAffected}` );

    if ( snapshot.lastRun.ruleImpacts.length ) {
      lines.push( "  Rules involved:" );
      for ( const impact of snapshot.lastRun.ruleImpacts ) {
        lines.push( `    ${impact.rule}: ${impact.lines} lines` );
      }
    } else {
      lines.push( "  Rules involved: none" );
    }
    lines.push( "" );
  } else {
    lines.push( "Last Run" );
    lines.push( "  No formatter run recorded in this session." );
    lines.push( "" );
  }

  // Notes
  if ( snapshot.notes.length ) {
    lines.push( "Notes" );
    for ( const note of snapshot.notes ) {
      lines.push( `  ${note}` );
    }
    lines.push( "" );
  }

  return lines.join( "\n" );
}
