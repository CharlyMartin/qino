import fs from "node:fs";
import path from "node:path";

type PackageJson = {
  name: string;
  version: string;
  license?: string;
};

const HEADER = [
  "# Third-party licenses",
  "This package bundles code from the packages below, each under its own license.",
].join("\n\n");

// `LICENSE`, `LICENSE-MIT`, `license.md`, `COPYING`, Apache's `NOTICE`, and
// upstream notices such as Rolldown's `THIRD-PARTY-LICENSE`.
const LICENSE_FILE = /licen[cs]e|copying|notice/i;

/**
 * Lists packages with every license file each one ships, sorted by name so
 * the output only changes when the bundle does.
 */
export function formatThirdPartyLicenses(packageRoots: Iterable<string>) {
  const sections = new Map<string, string>();
  for (const root of packageRoots) {
    const packageJson = JSON.parse(
      fs.readFileSync(path.join(root, "package.json"), "utf8"),
    ) as PackageJson;
    const texts = fs
      .readdirSync(root, { withFileTypes: true })
      .filter((entry) => entry.isFile() && LICENSE_FILE.test(entry.name))
      .map((entry) => entry.name)
      .sort()
      .map((name) => {
        const text = fs.readFileSync(path.join(root, name), "utf8").trim();
        return `\`\`\`text\n${text}\n\`\`\``;
      });
    const id = `${packageJson.name}@${packageJson.version}`;
    sections.set(
      id,
      [
        `## ${id}`,
        `License: ${packageJson.license ?? "not stated"}`,
        ...(texts.length > 0 ? texts : ["The package has no license file."]),
      ].join("\n\n"),
    );
  }

  const sorted = [...sections.keys()].sort();
  return `${[HEADER, ...sorted.map((id) => sections.get(id))].join("\n\n")}\n`;
}
