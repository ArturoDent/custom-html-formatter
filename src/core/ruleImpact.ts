/**
 * Formatter rule impact telemetry.
 *
 * This module records and summarizes indentation changes caused by
 * individual formatter rules during a formatting run.
 */

export interface RuleImpact {
  // Human-readable rule identifier (e.g. "noIndentUnder(body)")
  rule: string;
  // Indentation delta in spaces (positive or negative)
  delta: number;
  // 1-based line number where the change occurred
  line: number;
}

/**
 * Internal accumulator used during a single formatting run.
 *
 * This array is cleared before each run and populated as rules
 * apply indentation changes.
 */
export const ruleImpacts: RuleImpact[] = [];

/**
 * Snapshot of rule impacts from the most recent completed formatting run.
 *
 * This is separate from the live accumulator so health reporting
 * can safely read stable data.
 */
let lastRuleImpacts: RuleImpact[] = [];

/**
 * Stores the finalized rule impacts from a formatting run.
 *
 * Callers are responsible for ensuring these impacts are still valid
 * with respect to document version and configuration.
 */
export function setLastRuleImpacts( impacts: RuleImpact[] ) {
  lastRuleImpacts = impacts;
}

/**
 * Returns the rule impacts from the most recent formatting run.
 * If no valid run has occurred, this returns an empty array.
 */
export function getLastRuleImpacts(): RuleImpact[] {
  return lastRuleImpacts;
}

/**
 * Clears the stored rule impacts snapshot.
 *
 * This must be called whenever formatter runtime state is invalidated
 * (e.g. document edits, configuration changes).
 */
export function clearLastRuleImpacts() {
  setLastRuleImpacts( [] );
}

/**
 * Records a single indentation change caused by a formatter rule.
 *
 * This function is called at the exact moment a rule suppresses
 * or alters indentation.
 *
 * Zero-delta changes are intentionally ignored to avoid noise.
 */
export function recordRuleImpact(
  rule: string,
  delta: number,
  line: number
): void {
  if ( delta !== 0 ) {
    ruleImpacts.push( { rule, delta, line } );
  }
}

/**
 * Clears all recorded rule impacts for the current formatting run.
 *
 * This must be called before each formatter invocation to ensure
 * telemetry reflects only the current run.
 */
export function clearRuleImpacts(): void {
  ruleImpacts.length = 0;
}

/**
 * Aggregated summary of rule impacts.
 *
 * Used for formatter health reporting to explain behavior
 * without exposing line-level detail.
 */
export interface RuleImpactSummary {
  rule: string;
  count: number;
}

/**
 * Summarizes rule impacts by rule identifier.
 *
 * This collapses line-level telemetry into a concise explanation
 * suitable for UI presentation.
 */
export function summarizeRuleImpacts( impacts: RuleImpact[] ): RuleImpactSummary[] {

  const map = new Map<string, number>();

  for ( const impact of impacts ) {
    map.set( impact.rule, ( map.get( impact.rule ) ?? 0 ) + 1 );
  }

  return [...map.entries()].map( ( [rule, count] ) => ( {
    rule,
    count
  } ) );
}
