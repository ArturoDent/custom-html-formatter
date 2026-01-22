import * as fs from "fs";
import * as path from "path";

export function loadFixtureConfig(fixtureInputPath: string): Record<string, unknown> {
  
  const dir = path.dirname(fixtureInputPath);
  const base = fixtureInputPath.replace(".input.html", "");

  const folderConfigPath = path.join(
    dir,
    `${path.basename(dir)}.config.json`
  );

  const fixtureConfigPath = `${base}.config.json`;

  let config: Record<string, unknown> = {};

  if (fs.existsSync(folderConfigPath)) {
    config = {
      ...config,
      ...JSON.parse(fs.readFileSync(folderConfigPath, "utf8"))
    };
  }

  if (fs.existsSync(fixtureConfigPath)) {
    config = {
      ...config,
      ...JSON.parse(fs.readFileSync(fixtureConfigPath, "utf8"))
    };
  }

  return config;
}
