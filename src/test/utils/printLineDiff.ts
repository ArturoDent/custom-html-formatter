import * as diff from "diff";

/**
 * Minimal, formatter-focused line diff utility.
 *
 * This module exists to make formatter test failures explainable:
 * - shows only added/removed lines
 * - preserves indentation exactly
 * - highlights indentation deltas inline
 *
 * It is intentionally not a general-purpose diff.
 */

// Enable ANSI colors only when output is a TTY.
const useColor = process.stdout.isTTY;

const red = (s: string) => (useColor ? `\x1b[31m${s}\x1b[0m` : s);
const green = (s: string) => (useColor ? `\x1b[32m${s}\x1b[0m` : s);
const gray = (s: string) => (useColor ? `\x1b[90m${s}\x1b[0m` : s);

/**
 * Analyzes leading indentation on a single line.
 *
 * Tabs and spaces are tracked separately so output can explain
 * indentation style as well as magnitude.
 */
function analyzeIndent(line: string) {
  let spaces = 0;
  let tabs = 0;

  for (const ch of line) {
    if (ch === " ") spaces++;
    else if (ch === "\t") tabs++;
    else break;
  }

  // Tabs are normalized to a fixed width for delta math.
  // This value is intentionally simple and test-oriented.
  const total = spaces + tabs * 2;

  return {spaces, tabs, total};
}

/**
 * Prints a minimal, line-based diff between expected and actual output.
 *
 * Returns true if any visible differences were printed.
 *
 * This function is designed for formatter tests and debugging:
 * - no context lines
 * - no patch headers
 * - no reflow or trimming
 */
export function printLineDiff(
  expected: string,
  actual: string,
  options?: {
    normalizeLineEndings?: boolean;
    header?: string;
    showLineNumbers?: boolean;
  }
): boolean {
  const normalize = (text: string) =>
    options?.normalizeLineEndings === false
      ? text
      : text.replace(/\r\n/g, "\n");

  const expectedText = normalize(expected);
  const actualText = normalize(actual);

  const expectedLines = expectedText.split("\n");
  const parts = diff.diffLines(expectedText, actualText);

  if (options?.header) {
    console.log(options.header);
  }

  let expectedLine = 1;
  let actualLine = 1;
  let printed = false;

  for (const part of parts) {
    const lines = part.value.split("\n");

    // Remove trailing empty line caused by ending newline.
    if (lines[lines.length - 1] === "") lines.pop();

    if (part.added || part.removed) {
      printed = true;

      const isAdded = part.added;
      const prefix = isAdded ? "+" : "-";
      const color = isAdded ? green : red;

      for (const line of lines) {
        const lineNo = isAdded ? actualLine : expectedLine;
        const indent = analyzeIndent(line);

        let suffix = "";

        // Optional indentation summary for debugging whitespace issues.
        if (options?.showLineNumbers) {
          suffix = ` (indent: ${indent.tabs
            ? `${indent.tabs} tabs`
            : `${indent.spaces} spaces`
            })`;
        }

        // Inline indentation delta is shown only on added lines.
        // This explains *why* formatting changed without extra output.
        if (isAdded) {
          const expectedIndent = analyzeIndent(
            expectedLines[lineNo - 1] ?? ""
          );

          const delta = indent.total - expectedIndent.total;
          if (delta !== 0) {
            suffix += `, Δ ${delta > 0 ? "+" : ""}${delta}`;
          }
        }

        console.log(
          color(
            `${prefix}${lineNo.toString().padStart(4)} | ${line}${gray(suffix)}`
          )
        );

        isAdded ? actualLine++ : expectedLine++;
      }
    } else {
      // Unchanged block: advance both cursors without printing.
      expectedLine += lines.length;
      actualLine += lines.length;
    }
  }

  return printed;
}
