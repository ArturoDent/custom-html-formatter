import * as vscode from 'vscode';
import * as fs from "fs";
import * as path from "path";
import { HtmlBeautifyOptions } from 'js-beautify';

// these are the default js-beautify html options
// set to vscode's html format settings
export function getBeautifyOptions(
  formatting: vscode.FormattingOptions
): HtmlBeautifyOptions {

  const htmlCfg = vscode.workspace.getConfiguration( 'html.format' );
  // const editorCfg = vscode.workspace.getConfiguration( 'editor', document.uri );

  return {
    // Indentation
    indent_size: formatting.tabSize,
    indent_with_tabs: !formatting.insertSpaces,
    indent_char: formatting.insertSpaces ? ' ' : '\t',

    // Line wrapping
    wrap_line_length: htmlCfg.get<number>( 'wrapLineLength', 120 ),

    // Newline behavior
    preserve_newlines: htmlCfg.get<boolean>( 'preserveNewLines', true ),
    max_preserve_newlines: htmlCfg.get<number>( 'maxPreserveNewLines', 10 ),
    end_with_newline: htmlCfg.get<boolean>( 'endWithNewline', false ),

    // HTML-specific behavior
    // so js-beautify mimics the built-in html formatter
    indent_inner_html: htmlCfg.get<boolean>( 'indentInnerHtml', false ),
    indent_body_inner_html: htmlCfg.get<boolean>( 'indentInnerHtml', false ),
    indent_head_inner_html: htmlCfg.get<boolean>( 'indentInnerHtml', false ),

    wrap_attributes: htmlCfg.get<any>( 'wrapAttributes', 'auto' ),
    wrap_attributes_indent_size: htmlCfg.get<number>( 'wrapAttributesIndentSize', 4 ),

    unformatted: htmlCfg.get<string[]>( 'unformatted', [] ),
    content_unformatted: htmlCfg.get<string[]>( 'contentUnformatted', [] ),
    extra_liners: htmlCfg.get<string[]>( 'extraLiners', ['head', 'body', '/html'] ),

    // Templating support
    templating: htmlCfg.get<string[]>( 'templating', ['auto'] )
  };
}

// only looks in the workspace root or .config/.jsbeautifyrc
export function loadJsBeautifyRc( document: vscode.TextDocument ): any {

  const workspaceFolder = vscode.workspace.getWorkspaceFolder( document.uri );
  if ( !workspaceFolder ) return {};

  const candidates = [
    ".jsbeautifyrc",     // prefer this
    ".beautifyrc",
    "jsbeautify.json",
    ".config/.jsbeautifyrc"
  ];

  for ( const file of candidates ) {
    const fullPath = path.join( workspaceFolder.uri.fsPath, file );
    if ( fs.existsSync( fullPath ) ) {
      try {
        const text = fs.readFileSync( fullPath, "utf8" );
        return JSON.parse( text );
      } catch ( err ) {
        console.warn( "Failed to parse .jsbeautifyrc:", err );
      }
    }
  }

  return {};
}