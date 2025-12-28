# Custom HTML Formatter

A VS Code extension that formats HTML with selector-based indentation rules.

## What it does

Default behavior:

- Do **not** indent direct children of `<body>`
- Indent nested children normally (e.g., `<li>` under `<ul>`)

## Settings

```json
"customHtmlFormatter.rules": {
  "noIndentUnder": ["body"],
  "indentSize": 2,
  "preserveBlankLines": true
}
