/**
 * Formatter Runtime State — Lifecycle
 *
 *   ┌──────────────┐
 *   │ No State     │
 *   │ (initial)    │
 *   └──────┬───────┘
 *          │
 *          │ format document
 *          ▼
 *   ┌──────────────────────────┐
 *   │ recordFormatRun()        │
 *   │                          │
 *   │ - document URI           │
 *   │ - document version       │
 *   │ - rule impacts           │
 *   │ - timestamp              │
 *   └──────────┬───────────────┘
 *              │
 *              │ health queried
 *              ▼
 *   ┌──────────────────────────┐
 *   │ Formatter Health         │
 *   │                          │
 *   │ - explains what happened │
 *   │ - never mutates state    │
 *   └──────────┬───────────────┘
 *              │
 *              │ any invalidation event
 *              │ (edit, doc switch, config change)
 *              ▼
 *   ┌──────────────────────────┐
 *   │ clearFormatRunState()    │
 *   │                          │
 *   │ - clears all telemetry   │
 *   │ - prevents stale output  │
 *   └──────────┬───────────────┘
 *              │
 *              ▼
 *        (back to No State)
 *
 * Invariant:
 * Runtime formatter state is valid only for one document,
 * one version, and one configuration.
 */


import * as vscode from "vscode";
import {
  type RuleImpact,
  setLastRuleImpacts,
  clearLastRuleImpacts
} from "../core/ruleImpact";

export type FormatterLastRunMode = "format" | "none";

/**
 * Formatter runtime state.
 *
 * This module records what happened during the most recent formatting run
 * so that formatter health reporting can explain behavior accurately.
 */

// Document version at the time formatting last ran.
// Used to detect edits that invalidate recorded rule impacts.
let lastFormattedVersion: number | undefined;

// URI of the document that was last formatted.
// Prevents rule impacts from leaking across documents.
let lastFormattedUri: vscode.Uri | undefined;

// Timestamp of the most recent formatting run.
// Used for health reporting and debugging.
let lastFormatRunAt: number | undefined;

// lastRunMode tracks the last *actual* formatting run. 
// Dry runs are intentionally excluded.
let lastRunMode: FormatterLastRunMode;

let awaitingFormatResultVersion = false;
let lastFormattedResultVersion: number | undefined;


/**
 * Records the outcome of a successful formatting run.
 *
 * This captures enough information to later determine whether the
 * recorded rule impacts are still valid for the current editor state.
 */
export function recordFormatRun(
  document: vscode.TextDocument,
  impacts: RuleImpact[]
) {
  setLastRuleImpacts( impacts );
  lastFormattedVersion = document.version;
  lastFormattedUri = document.uri;
  lastFormatRunAt = Date.now();
  lastRunMode = "format";
}

export function getLastRunMode(): FormatterLastRunMode {
  return lastRunMode;
}

/**
 * Returns the document version associated with the last formatting run.
 * If undefined, no valid formatting run is currently recorded.
 */
export function getLastFormattedVersion() {
  return lastFormattedVersion;
}

/**
 * Returns the URI of the document that was last formatted.
 * Used to ensure rule impacts are only applied to the correct document.
 */
export function getLastFormattedUri() {
  return lastFormattedUri;
}

/**
 * Returns the timestamp of the most recent formatting run, if any.
 */
export function getLastFormatRunAt() {
  return lastFormatRunAt;
}

/**
 * Clears all recorded formatter runtime state.
 *
 * This must be called whenever:
 * - the formatted document changes
 * - the document content changes after formatting
 * - formatter configuration changes
 *
 * Clearing state atomically ensures health reporting never
 * surfaces stale or misleading information.
 */
export function clearFormatRunState() {
  clearLastRuleImpacts();
  lastFormattedVersion = undefined;
  lastFormattedUri = undefined;
  lastFormatRunAt = undefined;
  lastRunMode = "none";
}


export function markFormatRunStarted() {
  awaitingFormatResultVersion = true;
}

export function recordFormatResultVersion( version: number ) {
  lastFormattedResultVersion = version;
  awaitingFormatResultVersion = false;
}

export function isAwaitingFormatResultVersion() {
  return awaitingFormatResultVersion;
}

export function getLastFormattedResultVersion() {
  return lastFormattedResultVersion;
}

// --- Dry run state ---------------------------------------------

let lastDryRunImpacts: RuleImpact[] | undefined;

export function setLastDryRunImpacts( impacts: RuleImpact[] ) {
  lastDryRunImpacts = impacts;
}

export function getLastDryRunImpacts() {
  return lastDryRunImpacts;
}
