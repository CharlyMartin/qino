import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, beforeEach, describe, expect, test } from "vitest";

import { formatThirdPartyLicenses } from "./format-third-party-licenses";

let tmp: string;

beforeEach(async () => {
  tmp = await fs.mkdtemp(path.join(os.tmpdir(), "qino-licenses-"));
});

afterEach(async () => {
  await fs.rm(tmp, { recursive: true, force: true });
});

type FakePackage = {
  name: string;
  version: string;
  license?: string;
  files?: Record<string, string>;
};

async function writePackage({ name, version, license, files }: FakePackage) {
  const root = path.join(tmp, "node_modules", name);
  await fs.mkdir(root, { recursive: true });
  await fs.writeFile(
    path.join(root, "package.json"),
    JSON.stringify({ name, version, license }),
  );
  for (const [file, text] of Object.entries(files ?? {})) {
    await fs.mkdir(path.dirname(path.join(root, file)), { recursive: true });
    await fs.writeFile(path.join(root, file), text);
  }
  return root;
}

const HEADER = [
  "# Third-party licenses",
  "This package bundles code from the packages below, each under its own license.",
];

describe("formatThirdPartyLicenses", () => {
  test("lists each package once, sorted, with its license text", async () => {
    const zed = await writePackage({
      name: "zed",
      version: "1.0.0",
      license: "MIT",
      files: { license: "Copyright (c) Zed\n" },
    });
    const scoped = await writePackage({
      name: "@scope/alpha",
      version: "2.1.0",
      license: "ISC",
      files: { "LICENSE.md": "Copyright (c) Alpha" },
    });

    const sections = [
      ...HEADER,
      "## @scope/alpha@2.1.0",
      "License: ISC",
      "```text\nCopyright (c) Alpha\n```",
      "## zed@1.0.0",
      "License: MIT",
      "```text\nCopyright (c) Zed\n```",
    ];
    expect(formatThirdPartyLicenses([zed, scoped, zed])).toBe(
      `${sections.join("\n\n")}\n`,
    );
  });

  test("includes every license and notice file, in name order", async () => {
    const root = await writePackage({
      name: "dual",
      version: "1.0.0",
      license: "(MIT OR Apache-2.0)",
      files: {
        "LICENSE-MIT": "MIT text",
        "LICENSE-APACHE": "Apache text",
        NOTICE: "Notice text",
        "THIRD-PARTY-LICENSE": "Upstream text",
        "licenses/other.txt": "Not a top-level license file",
        "README.md": "Not a license",
      },
    });

    const text = formatThirdPartyLicenses([root]);

    expect(text).toContain(
      [
        "## dual@1.0.0",
        "License: (MIT OR Apache-2.0)",
        "```text\nApache text\n```",
        "```text\nMIT text\n```",
        "```text\nNotice text\n```",
        "```text\nUpstream text\n```",
      ].join("\n\n"),
    );
    expect(text).not.toContain("Not a");
  });

  test("reads a license shipped as COPYING", async () => {
    const root = await writePackage({
      name: "gnu-style",
      version: "3.0.0",
      license: "MIT",
      files: { COPYING: "Copying text" },
    });

    expect(formatThirdPartyLicenses([root])).toContain(
      "License: MIT\n\n```text\nCopying text\n```",
    );
  });

  test("says so when a package has no license file or field", async () => {
    const root = await writePackage({ name: "bare", version: "0.1.0" });

    expect(formatThirdPartyLicenses([root])).toContain(
      "## bare@0.1.0\n\nLicense: not stated\n\nThe package has no license file.",
    );
  });

  test("lists no packages for a bundle without third-party code", () => {
    expect(formatThirdPartyLicenses([])).toBe(`${HEADER.join("\n\n")}\n`);
  });
});
