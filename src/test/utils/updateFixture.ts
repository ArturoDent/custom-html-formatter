import * as fs from "fs";
import * as path from "path";

export function maybeUpdateFixture(
  expectedPath: string,
  actual: string
): boolean {
  if (process.argv.includes("--update-fixtures")) {
    fs.writeFileSync(expectedPath, actual, "utf8");
    console.log(`✔ Updated fixture: ${path.basename(expectedPath)}`);
    return true;
  }
  return false;
}
