import { parseHtmlWithLocations } from "../../../src/core/formatter";

export function parseHtml( html: string ) {
  return parseHtmlWithLocations( html );
}