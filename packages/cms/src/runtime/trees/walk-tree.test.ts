import fs from "node:fs/promises";
import os from "node:os";
import nodePath from "node:path";

import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { z } from "zod";

import { makeReadParsed } from "../../test-utils/make-read-parsed";
import { walkTree } from "./walk-tree";

const Schema = z.object({
  title: z.string(),
});

async function writeMd(dir: string, name: string, title: string) {
  await fs.writeFile(
    nodePath.join(dir, `${name}.md`),
    ["---", `title: ${title}`, "---", "", `# ${title}`].join("\n"),
  );
}

let tmp: string;

beforeEach(async () => {
  tmp = await fs.mkdtemp(nodePath.join(os.tmpdir(), "qino-walk-"));
});

afterEach(async () => {
  await fs.rm(tmp, { recursive: true, force: true });
});

describe("walkTree", () => {
  test("walks a flat tree alphabetically when _order.json is absent", async () => {
    await writeMd(tmp, "installation", "Installation");
    await writeMd(tmp, "introduction", "Introduction");

    const nodes = await walkTree({
      directoryPath: tmp,
      readParsed: makeReadParsed(Schema),
      extension: ".md",
      titleField: "title",
      orderFileName: "_order.json",
    });

    expect(nodes.map((n) => n.slug)).toEqual(["installation", "introduction"]);
    expect(nodes[0]?.title).toBe("Installation");
  });

  test("honours _order.json and appends unlisted entries after listed ones", async () => {
    await writeMd(tmp, "installation", "Installation");
    await writeMd(tmp, "introduction", "Introduction");
    await writeMd(tmp, "z-extra", "Extra");
    await fs.writeFile(
      nodePath.join(tmp, "_order.json"),
      JSON.stringify(["introduction.md", "installation.md"]),
    );

    const nodes = await walkTree({
      directoryPath: tmp,
      readParsed: makeReadParsed(Schema),
      extension: ".md",
      titleField: "title",
      orderFileName: "_order.json",
    });

    expect(nodes.map((n) => n.slug)).toEqual([
      "introduction",
      "installation",
      "z-extra",
    ]);
  });

  test("pairs <name>.md with sibling <name>/ folder for sections", async () => {
    await writeMd(tmp, "introduction", "Introduction");
    await writeMd(tmp, "guides", "Guides");

    const guidesDir = nodePath.join(tmp, "guides");
    await fs.mkdir(guidesDir);
    await writeMd(guidesDir, "queries", "Queries");
    await writeMd(guidesDir, "mutations", "Mutations");

    const nodes = await walkTree({
      directoryPath: tmp,
      readParsed: makeReadParsed(Schema),
      extension: ".md",
      titleField: "title",
      orderFileName: "_order.json",
    });

    const guides = nodes.find((n) => n.slug == "guides");
    expect(guides?.children.map((c) => c.slug)).toEqual([
      "guides/mutations",
      "guides/queries",
    ]);
  });

  test("ignores an empty <name>/ folder and treats sibling file as a leaf", async () => {
    await writeMd(tmp, "introduction", "Introduction");
    await fs.mkdir(nodePath.join(tmp, "introduction"));

    const nodes = await walkTree({
      directoryPath: tmp,
      readParsed: makeReadParsed(Schema),
      extension: ".md",
      titleField: "title",
      orderFileName: "_order.json",
    });

    expect(nodes).toHaveLength(1);
    expect(nodes[0]?.slug).toBe("introduction");
    expect(nodes[0]?.children).toEqual([]);
  });

  test("throws when a non-empty <name>/ folder has no sibling <name>.md", async () => {
    await writeMd(tmp, "introduction", "Introduction");
    const orphan = nodePath.join(tmp, "guides");
    await fs.mkdir(orphan);
    await writeMd(orphan, "queries", "Queries");

    await expect(
      walkTree({
        directoryPath: tmp,
        readParsed: makeReadParsed(Schema),
        extension: ".md",
        titleField: "title",
        orderFileName: "_order.json",
      }),
    ).rejects.toThrow(
      /folder "guides" is missing its sibling file "guides\.md"/,
    );
  });

  test("throws when _order.json references a non-existent entry", async () => {
    await writeMd(tmp, "introduction", "Introduction");
    await fs.writeFile(
      nodePath.join(tmp, "_order.json"),
      JSON.stringify(["introduction.md", "nope.md"]),
    );

    await expect(
      walkTree({
        directoryPath: tmp,
        readParsed: makeReadParsed(Schema),
        extension: ".md",
        titleField: "title",
        orderFileName: "_order.json",
      }),
    ).rejects.toThrow(/entry "nope\.md" does not exist on disk/);
  });

  test("treats non-extension files as ignored, including the order file itself", async () => {
    await writeMd(tmp, "introduction", "Introduction");
    await fs.writeFile(nodePath.join(tmp, "_order.json"), JSON.stringify([]));
    await fs.writeFile(nodePath.join(tmp, "README.txt"), "ignored");

    const nodes = await walkTree({
      directoryPath: tmp,
      readParsed: makeReadParsed(Schema),
      extension: ".md",
      titleField: "title",
      orderFileName: "_order.json",
    });

    expect(nodes.map((n) => n.slug)).toEqual(["introduction"]);
  });

  test("skips node_modules and dot-folders", async () => {
    await writeMd(tmp, "a", "A");

    const pkgDir = nodePath.join(tmp, "node_modules/pkg");
    await fs.mkdir(pkgDir, { recursive: true });
    await writeMd(pkgDir, "index", "Index");

    const gitDir = nodePath.join(tmp, ".git");
    await fs.mkdir(gitDir);
    await writeMd(gitDir, "x", "X");

    const nodes = await walkTree({
      directoryPath: tmp,
      readParsed: makeReadParsed(Schema),
      extension: ".md",
      titleField: "title",
      orderFileName: "_order.json",
    });

    expect(nodes.map((n) => n.slug)).toEqual(["a"]);
  });

  describe("concurrent reads", () => {
    // Rejects the named files after their delay, in milliseconds, and reads
    // the others with the real schema.
    function makeTimedReader(failures: Record<string, number>) {
      const read = makeReadParsed(Schema);
      let active = 0;
      const reader = {
        maxActive: 0,
        async readParsed(filePath: string) {
          active += 1;
          reader.maxActive = Math.max(reader.maxActive, active);
          const name = nodePath.relative(tmp, filePath);
          await new Promise((resolve) =>
            setTimeout(resolve, failures[name] ?? 5),
          );
          active -= 1;
          if (name in failures) throw new Error(`${name} failed`);
          return read(filePath);
        },
      };
      return reader;
    }

    function walk(reader: ReturnType<typeof makeTimedReader>) {
      return walkTree({
        directoryPath: tmp,
        readParsed: reader.readParsed,
        extension: ".md",
        titleField: "title",
        orderFileName: "_order.json",
      });
    }

    test("reads a folder's files at the same time", async () => {
      for (const name of ["a", "b", "c"]) await writeMd(tmp, name, name);
      const reader = makeTimedReader({});

      const nodes = await walk(reader);

      expect(nodes.map((n) => n.slug)).toEqual(["a", "b", "c"]);
      expect(reader.maxActive).toBe(3);
    });

    test("throws the first failing file by name, not the first to fail", async () => {
      for (const name of ["a", "b"]) await writeMd(tmp, name, name);
      const reader = makeTimedReader({ "a.md": 30, "b.md": 0 });

      await expect(walk(reader)).rejects.toThrow("a.md failed");
    });

    test("throws a subfolder's failure before its parent's files", async () => {
      await writeMd(tmp, "a", "A");
      await writeMd(tmp, "guide", "Guide");
      await fs.mkdir(nodePath.join(tmp, "guide"));
      await writeMd(nodePath.join(tmp, "guide"), "setup", "Setup");
      const reader = makeTimedReader({ "a.md": 0, "guide/setup.md": 30 });

      await expect(walk(reader)).rejects.toThrow("guide/setup.md failed");
    });

    test("nests a subfolder under its sibling file", async () => {
      await writeMd(tmp, "guide", "Guide");
      await fs.mkdir(nodePath.join(tmp, "guide"));
      for (const name of ["setup", "usage"]) {
        await writeMd(nodePath.join(tmp, "guide"), name, name);
      }

      const [guide] = await walk(makeTimedReader({}));

      expect(guide?.children.map((n) => n.slug)).toEqual([
        "guide/setup",
        "guide/usage",
      ]);
    });
  });
});
