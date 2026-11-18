import fs from "node:fs";
import { findPackageJSON } from "node:module";
import { fileURLToPath } from "node:url";

import { expect, test } from "vitest";

type PackageJson = {
  name: string;
  exports?: unknown;
  dependencies?: Record<string, string>;
  optionalDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
};

// `next dev` resolves the `development` export condition. The markdown
// parser's development builds run several times slower, so those packages are
// devDependencies, bundled into dist with their production builds.
test("no runtime dependency ships a development build", () => {
  const seen = new Set<string>();
  const withDevelopmentBuilds: Array<string> = [];
  const queue = [fileURLToPath(new URL("../../package.json", import.meta.url))];

  for (let file = queue.pop(); file; file = queue.pop()) {
    const packageJson = JSON.parse(
      fs.readFileSync(file, "utf8"),
    ) as PackageJson;
    if (JSON.stringify(packageJson.exports ?? {}).includes('"development":')) {
      withDevelopmentBuilds.push(packageJson.name);
    }

    const names = Object.keys({
      ...packageJson.dependencies,
      ...packageJson.optionalDependencies,
      ...packageJson.peerDependencies,
    });
    for (const name of names) {
      let found: string | undefined;
      try {
        found = findPackageJSON(name, file);
      } catch {
        // Not installed: an optional dependency for another platform, or an
        // optional peer.
        continue;
      }
      // pnpm links each package's dependencies next to its real path.
      const real = found && fs.realpathSync(found);
      if (!real || seen.has(real)) continue;
      seen.add(real);
      queue.push(real);
    }
  }

  expect(seen.size).toBeGreaterThan(10);
  expect(withDevelopmentBuilds).toEqual([]);
});
