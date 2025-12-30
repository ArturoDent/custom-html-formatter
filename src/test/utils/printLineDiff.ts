import * as diff from "diff";

const useColor = process.stdout.isTTY;

const red = (s: string) => (useColor ? `\x1b[31m${s}\x1b[0m` : s);
const green = (s: string) => (useColor ? `\x1b[32m${s}\x1b[0m` : s);
const gray = (s: string) => (useColor ? `\x1b[90m${s}\x1b[0m` : s);

function analyzeIndent(line: string) {
  let spaces = 0;
  let tabs = 0;

  for (const ch of line) {
    if (ch === " ") spaces++;
    else if (ch === "\t") tabs++;
    else break;
  }

  // Treat a tab as 2 spaces for delta math (adjust if needed)
  const total = spaces + tabs * 2;

  return { spaces, tabs, total };
}

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

        if (options?.showLineNumbers) {
          suffix = ` (indent: ${
            indent.tabs
              ? `${indent.tabs} tabs`
              : `${indent.spaces} spaces`
          })`;
        }

        // Inline indentation delta (only on added lines)
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
      expectedLine += lines.length;
      actualLine += lines.length;
    }
  }

  // if (!printed) {
  //   console.log("(no visible line diff)");
  // }
  return printed;
}
