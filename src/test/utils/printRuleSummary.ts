import { type RuleImpact, summarizeRuleImpacts } from "../../core/ruleImpact";
import { getDryRunChannel } from '../../ui/output';

/**
 * Prints a concise, human-readable summary of rule impacts.
 *
 * IMPORTANT:
 * - This is informational output only.
 * - It does not influence formatting, diagnostics, or UI state.
 * - Absence of output is a valid and meaningful result.
 */
export function printRuleSummary( ruleImpacts: RuleImpact[] ): void {

  const summary = summarizeRuleImpacts( ruleImpacts );

  const channel = getDryRunChannel();
  channel.clear();

  // TODO: print file name here too
  channel.appendLine( "Custom HTML Formatter — Dry Run" );
  channel.appendLine( "──────────────────────────────" );
  channel.appendLine( "" );

  if ( !summary.length ) {
    channel.appendLine( "No indentation changes would be made." );
  } else {
    for ( const impact of summary ) {
      channel.appendLine(
        `${impact.rule}: ${impact.count} indentation changes`
      );
    }
  }

  channel.appendLine( "" );
  channel.appendLine( "No changes were applied." );
  channel.show( true );
}

