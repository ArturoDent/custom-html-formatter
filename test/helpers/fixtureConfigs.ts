// helpers/fixtureConfig.ts
export interface FixtureConfig {
  description?: string;
  indentSize?: number;
  defaultFormatter?: string;
  enableJsBeautify?: boolean;
  enableCustomFormatter?: boolean;
  rules?: string[] | null;
  noIndentUnder?: string[] | null;
  [key: string]: any;
}

/** Normalize raw values into predictable types */
export function normalizeConfig( raw: any ): FixtureConfig {
  const out: any = { ...( raw || {} ) };

  out.indentSize = out.indentSize == null ? undefined : Number( out.indentSize ) || undefined;
  out.defaultFormatter = out.defaultFormatter == null ? undefined : String( out.defaultFormatter );
  out.enableJsBeautify = typeof out.enableJsBeautify === "boolean" ? out.enableJsBeautify : ( out.enableJsBeautify == null ? undefined : Boolean( out.enableJsBeautify ) );
  out.enableCustomFormatter = typeof out.enableCustomFormatter === "boolean" ? out.enableCustomFormatter : ( out.enableCustomFormatter == null ? undefined : Boolean( out.enableCustomFormatter ) );
  out.rules = normalizeArrayOrNull( out.rules );
  out.noIndentUnder = normalizeArrayOrNull( out.noIndentUnder );
  if ( out.description != null ) out.description = String( out.description );
  return out as FixtureConfig;
}

function normalizeArrayOrNull( value: any ): string[] | null | undefined {
  if ( value === null ) return null;
  if ( value === undefined ) return undefined;
  if ( Array.isArray( value ) ) return value.map( String ).map( s => s.trim() ).filter( Boolean );
  return [String( value ).trim()].filter( Boolean );
}

/** Merge arrays with union/dedup preserving order modeRoot -> case -> subfolder.
 *  If subfolderArr === null => explicit clear => return []
 */
function mergeArrayField( modeArr?: string[] | null, caseArr?: string[] | null, subfolderArr?: string[] | null ): string[] {
  if ( subfolderArr === null ) return [];
  const result: string[] = [];
  const pushUnique = ( items?: string[] | null ) => {
    if ( !items ) return;
    for ( const it of items ) {
      if ( !result.includes( it ) ) result.push( it );
    }
  };
  pushUnique( modeArr ?? [] );
  pushUnique( caseArr ?? [] );
  pushUnique( subfolderArr ?? [] );
  return result;
}

/** Merge order: modeRoot < case < subfolder */
export function mergeConfigs(
  modeRootRaw: any,
  caseRaw: any,
  subfolderRaw: any
): FixtureConfig {
  const modeRoot = normalizeConfig( modeRootRaw );
  const caseCfg = normalizeConfig( caseRaw );
  const sub = normalizeConfig( subfolderRaw );

  const out: FixtureConfig = {};

  out.indentSize = sub.indentSize ?? caseCfg.indentSize ?? modeRoot.indentSize;
  out.defaultFormatter = sub.defaultFormatter ?? caseCfg.defaultFormatter ?? modeRoot.defaultFormatter;
  out.enableJsBeautify = sub.enableJsBeautify ?? caseCfg.enableJsBeautify ?? modeRoot.enableJsBeautify;
  out.enableCustomFormatter = sub.enableCustomFormatter ?? caseCfg.enableCustomFormatter ?? modeRoot.enableCustomFormatter;
  out.description = sub.description ?? caseCfg.description ?? modeRoot.description;

  out.rules = mergeArrayField( modeRoot.rules, caseCfg.rules, sub.rules );
  out.noIndentUnder = mergeArrayField( modeRoot.noIndentUnder, caseCfg.noIndentUnder, sub.noIndentUnder );

  // copy any other keys from modeRoot/case/subfolder if not present
  const copyIfMissing = ( src: any ) => {
    if ( !src ) return;
    for ( const k of Object.keys( src ) ) {
      if ( !( k in out ) ) out[k] = src[k];
    }
  };
  copyIfMissing( modeRootRaw );
  copyIfMissing( caseRaw );
  copyIfMissing( subfolderRaw );

  return out;
}