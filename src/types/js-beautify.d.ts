// declare module 'js-beautify' {
//   export const html: ( text: string, options?: any ) => string;
//   export const css: ( text: string, options?: any ) => string;
//   export const js: ( text: string, options?: any ) => string;
// }

declare module 'js-beautify' {
  //
  // Shared base options
  //
  interface BeautifyBaseOptions {
    indent_size?: number;
    indent_char?: string;
    indent_with_tabs?: boolean;
    eol?: string;
    end_with_newline?: boolean;
    preserve_newlines?: boolean;
    max_preserve_newlines?: number;
    indent_level?: number;
    wrap_line_length?: number;
    indent_empty_lines?: boolean;
  }

  //
  // HTML-specific options
  //
  interface HtmlBeautifyOptions extends BeautifyBaseOptions {
    indent_inner_html?: boolean;
    indent_body_inner_html?: boolean;
    indent_head_inner_html?: boolean;

    wrap_attributes?:
    | 'auto'
    | 'force'
    | 'force-aligned'
    | 'force-expand-multiline'
    | 'aligned-multiple'
    | 'preserve'
    | 'preserve-aligned';

    wrap_attributes_min_attrs?: number;
    wrap_attributes_indent_size?: number;

    unformatted?: string[];
    content_unformatted?: string[];
    extra_liners?: string[];

    inline?: string[];
    void_elements?: string[];

    templating?: string[];
  }

  //
  // JS-specific options
  //
  interface JsBeautifyOptions extends BeautifyBaseOptions {
    space_in_paren?: boolean;
    space_in_empty_paren?: boolean;
    jslint_happy?: boolean;
    space_after_anon_function?: boolean;
    brace_style?:
    | 'collapse'
    | 'expand'
    | 'end-expand'
    | 'none'
    | 'preserve-inline';
    break_chained_methods?: boolean;
    keep_array_indentation?: boolean;
    unescape_strings?: boolean;
    comma_first?: boolean;
    operator_position?: 'before-newline' | 'after-newline' | 'preserve-newline';
  }

  //
  // CSS-specific options
  //
  interface CssBeautifyOptions extends BeautifyBaseOptions {
    selector_separator_newline?: boolean;
    newline_between_rules?: boolean;
    space_around_combinator?: boolean;
  }

  //
  // Exported functions
  //
  export function html(
    source: string,
    options?: HtmlBeautifyOptions
  ): string;

  export function js(
    source: string,
    options?: JsBeautifyOptions
  ): string;

  export function css(
    source: string,
    options?: CssBeautifyOptions
  ): string;
}