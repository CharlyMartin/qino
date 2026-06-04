import fs from "node:fs/promises";
import os from "node:os";
import nodePath from "node:path";

import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { z } from "zod";

import { MARKDOWN_BODY_FIELD_NAME } from "../../data";
import { buildTreeNode } from "./build-tree-node";

let tmp: string;

beforeEach(async () => {
  tmp = await fs.mkdtemp(nodePath.join(os.tmpdir(), "qino-node-"));
});

afterEach(async () => {
  await fs.rm(tmp, { recursive: true, force: true });
});

describe("buildTreeNode", () => {
  test("builds a node from a markdown file using its titleField", async () => {
    const filePath = nodePath.join(tmp, "introduction.md");
    await fs.writeFile(
      filePath,
      ["---", "title: Introduction", "---", "", "Welcome."].join("\n"),
    );

    const schema = z.object({
      title: z.string(),
      [MARKDOWN_BODY_FIELD_NAME]: z.string(),
    });

    const node = await buildTreeNode({
      schema,
      extension: ".md",
      titleField: "title",
      filePath,
      slug: "introduction",
      children: [],
    });

    expect(node).toMatchObject({
      slug: "introduction",
      title: "Introduction",
      fileName: "introduction.md",
      filePath,
      children: [],
    });
  });

  test("uses a custom titleField key", async () => {
    const filePath = nodePath.join(tmp, "page.md");
    await fs.writeFile(
      filePath,
      ["---", "label: Custom Label", "---", "body"].join("\n"),
    );

    const schema = z.object({
      label: z.string(),
      [MARKDOWN_BODY_FIELD_NAME]: z.string(),
    });

    const node = await buildTreeNode({
      schema,
      extension: ".md",
      titleField: "label",
      filePath,
      slug: "page",
      children: [],
    });

    expect(node.title).toBe("Custom Label");
  });

  test("propagates schema validation errors with the file path", async () => {
    const filePath = nodePath.join(tmp, "bad.md");
    await fs.writeFile(
      filePath,
      ["---", "title: 42", "---", "body"].join("\n"),
    );

    const schema = z.object({
      title: z.string(),
      [MARKDOWN_BODY_FIELD_NAME]: z.string(),
    });

    await expect(
      buildTreeNode({
        schema,
        extension: ".md",
        titleField: "title",
        filePath,
        slug: "bad",
        children: [],
      }),
    ).rejects.toThrow(/bad\.md.*title/s);
  });
});
