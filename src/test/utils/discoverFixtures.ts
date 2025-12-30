import * as fs from "fs";
import * as path from "path";

export interface FixturePair {
  name: string;
  inputPath: string;
  expectedPath: string;
}

export function discoverFixtures(dir: string): FixturePair[] {
  const files = fs.readdirSync(dir);

  const inputs = files.filter(f => f.endsWith(".input.html"));

  return inputs.map(inputFile => {
    const base = inputFile.replace(".input.html", "");
    const expectedFile = `${base}.expected.html`;

    const expectedPath = path.join(dir, expectedFile);
    if (!fs.existsSync(expectedPath)) {
      throw new Error(`Missing expected fixture: ${expectedFile}`);
    }

    return {
      name: base,
      inputPath: path.join(dir, inputFile),
      expectedPath
    };
  });
}
