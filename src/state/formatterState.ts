// import * as vscode from "vscode";
// import { DEFAULT_RULES } from "../core/rules";
import {
  getDefaultHtmlFormatter,
  getCurrentConfigs,
  setDefaultHtmlFormatter,
  updateRules
} from '../core/configs';


/**
 * Formatter state.
 *
 * This module determines which formatter *would* run for the active editor
 * and whether the custom formatter is configured with 'rules'.
 */

export type FormatterState =
  | "activeRules"                              // Custom formatter selected and rules are configured
  | "activeNoRules"                            // Custom formatter selected but no rules are configured
  | "activeNoIndentUnder"                      // Custom formatter selected but no rule.noIndentUnder
  | "builtin"                                  // VS Code's built-in formatter will run
  | "customFormatterEnabledJsBeautifyDisabled" // Custom Formatter enabled, js-beautify disabled
  | "customFormatterEnabledNotDefault"         // Custom formatter is not set as defaultFormatter
  | "jsBeautifyEnabledNotDefault";              // js-beautify is enabled but default formatter is not

// Cached formatter state used for UI interactions.
// Updated whenever getFormatterState() is called.
export let lastFormatterState: FormatterState | undefined;

export function getLastFormatterState(): FormatterState | undefined {
  return lastFormatterState;
}
export function setLastFormatterState( newState: FormatterState ): void {
  lastFormatterState = newState;
}
export function clearLastFormatterState(): void {
  lastFormatterState = undefined;
}

/**
 * Determines the effective formatter state for html files.
 *
 * This function resolves formatter behavior based on:
 * - HTML default formatter configuration
 * - presence of custom formatter rules
 */
export async function getFormatterState( configs: any ): Promise<FormatterState> {

  const state = await computeFormatterState( configs.enabled, configs.rules );
  lastFormatterState = state;
  return state;
}

export async function computeFormatterState( enabled: boolean, rules: any ): Promise<FormatterState> {

  // No default formatter configured for HTML.
  // if ( !defaultFormatter ) return "noFormatter";
  if ( !enabled ) return "customFormatterEnabledNotDefault";  // *** not enabled but not defaultformatter


  const defaultFormatter = await getDefaultHtmlFormatter();
  // A formatter is configured, but it is not the custom formatter.
  if ( defaultFormatter !== "ArturoDent.custom-html-formatter" ) return "builtin";

  // The formatter is considered active even if it produces no changes.
  // rules could be an empty array or only have indentSize or only noIndentUnder
  // rules: null or noIndentUnder.length === 0 or indentSize always present with default length

  // if ( rules && Object.keys( rules ).length === 0 ) return "activeNoRules";
  if ( rules && Object.keys( rules ).length === 0 ) return "activeNoRules";

  if ( !rules?.noIndentUnder?.length ) return "activeNoIndentUnder";

  return rules ? "activeRules" : "activeNoRules"; // TODO: another state "unknown"?
}