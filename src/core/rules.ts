/**
 * Formatter rule definitions and helpers.
 */

export interface FormatterRules {
  // Tags whose direct children should not be indented
  noIndentUnder: string[];
  // Number of spaces per indentation level
  indentSize: number | undefined;
}

export const DEFAULT_RULES: FormatterRules = {
  noIndentUnder: ["html", "body"],
  indentSize: 2
};


/**
 * Loads indentation rules from VS Code settings/configuration.
 *
 * Returns null when:
 * - the setting is unset
 * - the setting is not an object
 * - the setting is an empty object
 *
 * This allows callers to distinguish between:
 * - "formatter selected but no rules configured"
 * - "formatter not configured at all"
 */
export function loadRulesFromConfig( raw: any ): FormatterRules | undefined {
  if ( !raw || typeof raw !== "object" ) return undefined;

  // VS Code returns an empty proxy object for unset object-valued settings.
  // An empty object is treated as "no rules configured".
  if ( Object.keys( raw ).length === 0 ) return undefined;

  //       If rules exist at all:
  // Formatting must know how wide an indent is
  // → indentSize always resolves to a number

  // Suppressing indentation under tags is optional
  // If the user didn’t specify it, nothing is suppressed → noIndentUnder: []

  return {
    noIndentUnder: Array.isArray( raw.noIndentUnder )
      ? raw.noIndentUnder.map( String )
      : ( typeof raw.noIndentUnder === "string" )
        ? [raw.noIndentUnder]
        // : [],     // not an array or a string
        : undefined,     // not an array or a string

    // Default indentation size is applied only when rules exist.
    indentSize: typeof raw.indentSize === "number"
      ? raw.indentSize
      // : DEFAULT_RULES.indentSize
      : undefined
  };
}

/**
 * Minimal selector matching helper.
 * Only the tag name is matched.
 */
export function parentMatchesSelector(
  parentTagName: string,
  selector: string
): boolean {
  const tagPart = selector.split( /[#.]/ )[0]?.trim();
  if ( !tagPart ) return false;

  return tagPart.toLowerCase() === parentTagName.toLowerCase();
}
