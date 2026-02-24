# Custom HTML Formatter

A VS Code extension that formats HTML with selector-based indentation rules.

## What it does

- Enables direct children of chosen tags to NOT be indented

- If you would like another formatter `rule`, please let me know in GitHub issues.  

## How it works

Depending on the settings (discussed below), js-beautify (which vscode uses as its default html formatter) is run first.  And then that formatting result is run through this Custom HTML Formatter.  

So any `rules` in your settings are applied after normal vscode formatting.  

## Status Bar and Problems View

In this preview version, you will see a `Status Bar Item` that shows which html formatter is active and whether any `rules` have been set.  You can click on that Status Bar item to see relevant fixes.  

This same information is surfaced in the `Problems` view.  There are QuickFix options to resolve problems such as no `rules` or no `defaultFormatter` for html files, etc.  Hover over the Problem to get the QUickFix lightbulb to show up and click that for options.  

## Settings

If you want Custom HTML Formatter to handle HTML formatting, set it as your default formatter for html files and configure customHtmlFormatter.rules.

1. **customHtmlFormatter.configWriteScope** : workspace or global  
Write the rules and enablements of this custom formatter and js-beautify to global (user) or workspace settings.  

When you use one of this extension's commands to write `customHtmlFormatter.rules`  where should it go?

This setting, which defaults to `workspace`, will write or remove the settings either from the `workspace` settings.json or the `global` (i.e., user settings.json) scopes.  

2.  **customHtmlFormatter.jsBeautifyEnabled** // defaults to false  
This must be enabled in your settings for the extension's formatter to run.  If this setting is enabled, the js-beautify formatter will run.  If you wish, you can modify its options - discussed below.  

3.  **customHtmlFormatter.enabled** // defaults to false
If this setting is enabled **AND** the `jsBeautifyEnabled` setting is enabled, then your `rules` about not indenting under certain html elements will be used to format your html file.  If this setting is enabled but `jsBeautifyEnabled` is not enabled, then vscode's default html formatter will be run.  

4. **customHtmlFormatter.rules**

If you have no `rules` in your setting, but this Custom HTML Formatter **IS** enabled, the `js-beautify` formatter will run (if enabled).  

 Your chosen preferences for this custom formatter: indent size and which HTML tags to **NOT** indent under (i.e., **direct children** of these selected tags will be formatted flush left).  

`indentSize` has a default value of 2 spaces.  There is no default for the `noIndentUnder` setting.  

```jsonc
  "customHtmlFormatter.rules": {
    "noIndentUnder": [  // HTML tag names whose direct children should not be indented
      "html", 
      "body"
    ],
    "indentSize": 2     // indent size (in spaces)
  }
```

**Important**: This custom formatter will not be triggered unless you have **ALL** the following settings in your workspace or global settings:  

```jsonc
  // this is added automatically if you enable 
  // "customHtmlFormatter.enabled" or "customHtmlFormatter.jsBeautifyEnabled"
  "[html]": {
    "editor.defaultFormatter": "ArturoDent.custom-html-formatter"
  },

  "customHtmlFormatter.enabled": true,

  // this will be used even if  "customHtmlFormatter.enabled": false
  // if the defaultFormatter is set to this extension
  "customHtmlFormatter.jsBeautifyEnabled": true,

  "customHtmlFormatter.rules": {
  "noIndentUnder": [
    "html",         // whatever you want here
    "body",
    "ul",
    "ol"
  ],
  "indentSize": 2  // whatever size
}
```

## js-beautify Options

if you have `"customHtmlFormatter.jsBeautifyEnabled": true,` then this extension will run (even if `"customHtmlFormatter.enabled": false,`) or no `rules` in your settings.  `js-beautify` is what VS Code uses to format HTML.  Because this extension imports js-beautify you can use its options to control formatting.

For example, you can create a `.jsBeautifyrc` file in your root to modify its defaults:

```jsonc
{
  "html": {
    "_comment": "true will indent head/body, default = false",
    "indent_inner_html": true,
    
    "_comment": "true will indent under <head>, default = false",
    "indent_head_inner_html": true,
    
    "_comment": "true will indent under <body>, default = false",
    "indent_body_inner_html": true
  }
}
```

See [vscode-beautify](https://github.com/Quentium-Forks/vscode-beautify) and [settings/options](https://github.com/HookyQR/VSCodeBeautify/blob/master/Settings.md) for more options.

If all you wanted to do was prevent indentation of direct children under the html, body and head tags, you could just install the [vscode-beautify](https://marketplace.visualstudio.com/items?itemName=vsce-toolroom.vscode-beautify) extension.  You don't even need a `jsbeautifyrc` file because the defaults are `false` for those and thus indentation will be suppressed.

### What functionality does this extension add to js-beautify?

You can supress indentation under any tags you wish.  

```jsonc
"customHtmlFormatter.rules": {
  "noIndentUnder": [
    "html",
    "body",
    "ul",
    "ol"
  ],
  "indentSize": 2
}
```

That rule would supress indentation under the ul and ol tags as well as html and body.  That isn't possible under vscode's built-in HTML formatter or js-beautify.  

## Commands

1. **Custom HTML Formatter: Enable both js-beautify and Custom HTML Formatter and rules**  
`customHtmlFormatter.enableAllWithDefaults`

This will set  

```jsonc
  "[html]": {
    "editor.defaultFormatter": "ArturoDent.custom-html-formatter"
  },

  "customHtmlFormatter.enabled": true,
  "customHtmlFormatter.jsBeautifyEnabled": true,

  "customHtmlFormatter.rules": {
    "noIndentUnder": [     // you can change these if you wish
      "html",
      "body"
    ],
    "indentSize": 2
  }
```

2. **Custom HTML Formatter: Enable js-beautify and disable the Custom HTML Formatter**
`customHtmlFormatter.enableJsBeautifyOnly`

This will set  

```jsonc
  "[html]": {
    "editor.defaultFormatter": "ArturoDent.custom-html-formatter"
  },

  "customHtmlFormatter.enabled": true,
  "customHtmlFormatter.jssBeautifyEnabled": false
```

2. **Custom HTML Formatter: Revert to default html formatter**  
`customHtmlFormatter.restoreBuiltinHtmlFormatter`

This will set  

This will set in the global or workspace settings, depending on the value you chose for `customHtmlFormatter.configWriteScope`:

```jsonc
  "[html]": {
    "editor.defaultFormatter": "vscode.html-language-features"
  },

  "customHtmlFormatter.enabled": false,
  "customHtmlFormatter.jsBeautifyEnabled": false
```

If you comment out or remove a pre-existing `"customHtmlFormatter.jsBeautifyEnabled"` setting  VS Code will then apply its default built-in html formatter.  

1. **Custom HTML Formatter: Get document changes but DO NOT apply any edits**  
`customHtmlFormatter.dryRun`

This will report what changes to the current html file would have been made if the formatter had executed edits.  But no edits will be made when this command is run - in a sense, it is a preview of applicable edits.  

It will appear in an Output Channel called "Custom HTML Formatter" in your Output view (typically in the Panel unless you have moved it).  It should open automatically when there is output.  Since it is in an Output Channel it is persistent and you can examine it and the file at the same time.

Example output:

```plaintext
Custom HTML Formatter — Dry Run
──────────────────────────────

noIndentUnder(html): 4 indentation changes
noIndentUnder(body): 3 indentation changes

No changes were applied.
```

Think of that as indentation changed for 4 **tags** for direct descendants of the `<html>` tag.  And for 3 tags for direct decendants of the `<body>` tag.  

4. **Custom HTML Formatter: Show Health**  
`customHtmlFormatter.health`

This will report:

```plaintext
Custom HTML Formatter — Health
─────────────────────────────

Status
  Formatter active: yes
  Built‑in formatter: disabled
  Formatter scope: workspace

Configuration
  Indent unit: 2 spaces
  noIndentUnder: html, body
  Layout‑preserving mode: enabled

Last Run
  c:\Users\xxx\xxxx\Test Bed\test.html
  Timestamp: 2026‑01‑06 10:11:42
  Mode: dry run
  Lines affected: 3
  Rules involved:
    noIndentUnder(body): 3 lines

Notes
  Formatter is configured correctly.
  No conflicting settings detected.
```
