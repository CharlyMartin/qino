import fs from "node:fs/promises";
import os from "node:os";
import nodePath from "node:path";

import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { z } from "zod";

import { MARKDOWN_BODY_FIELD_NAME } from "../../data/globals";
import { walkTree } from "./walk-tree";

const Schema = z.object({
  title: z.string(),
  [MARKDOWN_BODY_FIELD_NAME]: z.string(),
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
      schema: Schema,
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
      schema: Schema,
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
      schema: Schema,
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
      schema: Schema,
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
        schema: Schema,
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
        schema: Schema,
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
      schema: Schema,
      extension: ".md",
      titleField: "title",
      orderFileName: "_order.json",
    });

    expect(nodes.map((n) => n.slug)).toEqual(["introduction"]);
  });
});
