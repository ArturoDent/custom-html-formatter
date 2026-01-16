# Custom HTML Formatter

A VS Code extension that formats HTML with selector-based indentation rules.

## What it does

- Enables direct children of chosen tags to NOT be indented

- If you would like another formatter `rule`, please let me know in GitHub issues.  

This formatter uses a structural indentation model, nearest‑ancestor rule attribution, and line‑based impact accounting.

## Status Bar and Problems View

In this preview version, you will see a `Status Bar Item` that shows which html formatter is active and whether any `rules` have been set.  You can click on that Status Bar item to see relevant fixes.  

This same information is surfaced in the `Problems` view.  There are QuickFix options to resolve problems such as no `rules` or no `defaultFormatter` for html files, etc.  Hover over the Problem to get the QUickFix lightbulb to show up and click that for options.  

## Settings

If you want Custom HTML Formatter to handle HTML formatting, set it as your default formatter for html files and configure customHtmlFormatter.rules.

1. **customHtmlFormatter.configWriteScope** : workspace or global  
Write the rules and default formatter choice to global (user) or workspace settings.  

When you use one of this extension's commands to write `customHtmlFormatter.rules` or the `[html] editor.defaultFormatter` settings, where should it go?

This setting, which defaults to `workspace`, will write or remove the settings either from the `workspace` settings.json or the `global` (i.e., user settings.json) scopes.  

2. **customHtmlFormatter.rules**

 Your chosen preferences for this formatter: indent size and which HTML tags to **NOT** indent under (i.e., **direct children** of these selected tags will be formatted flush left).  

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

**Important**: This custom formatter will not be triggered unless you have the following setting in your workspace or global settings:  

```jsonc
  // This extension's custom HTMl formatter
  "[html]": {
    "editor.defaultFormatter": "ArturoDent.custom-html-formatter"
  }
```

or  

```jsonc
  // revert to VSCode's default built-in HTML formatter
  "[html]": {
    "editor.defaultFormatter": "vscode.html-language-features"
  }
```

## Commands

1. **Custom HTML Formatter: Create defaultFormatter and rules settings**  
customHtmlFormatter.enableWithDefaults

This will set  

```jsonc
  "[html]": {
    "editor.defaultFormatter": "ArturoDent.custom-html-formatter"
  },
  "customHtmlFormatter.rules": {
    "noIndentUnder": [     // you can change these if you wish
      "html",
      "body"
    ],
    "indentSize": 2
  }
```

2. **Custom HTML Formatter: Revert to default html formatter**  
customHtmlFormatter.restoreBuiltinHtmlFormatter

This will set in the global or workspace settings, depending on the value you chose for `customHtmlFormatter.configWriteScope`,:

```jsonc
  "[html]": {
    "editor.defaultFormatter": "vscode.html-language-features"   // the default built-in formatter
  }
```

It is **NOT** sufficient to merely comment out or remove a pre-existing `[html] "editor.defaultFormatter": ..."` setting.  VS Code will not then apply its default built-in html formatter - it will just act as if there is NO default html formatter and nothing will happen in your html files when you try to format!  

3. **Custom HTML Formatter: Get document changes but DO NOT apply any edits**  
customHtmlFormatter.dryRun

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
customHtmlFormatter.health

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
