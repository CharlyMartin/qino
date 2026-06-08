import fs from "node:fs/promises";
import os from "node:os";
import nodePath from "node:path";

import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { z } from "zod";

import { MARKDOWN_BODY_FIELD_NAME, QinoMeta, QinoPrimitives } from "../../data";
import { createQino } from "../qino/create-qino";

let tmp: string;
let createTree: ReturnType<typeof createQino>["createTree"];

beforeEach(async () => {
  tmp = await fs.mkdtemp(nodePath.join(os.tmpdir(), "qino-tree-"));
  ({ createTree } = createQino({ contentFolder: tmp, mediaFolder: tmp }));
});

afterEach(async () => {
  await fs.rm(tmp, { recursive: true, force: true });
});

const Schema = z
  .object({ title: z.string(), [MARKDOWN_BODY_FIELD_NAME]: z.string() })
  .strict();

async function writeMd(dir: string, name: string, title: string, body = "") {
  await fs.writeFile(
    nodePath.join(dir, `${name}.md`),
    ["---", `title: ${title}`, "---", "", body || `# ${title}`].join("\n"),
  );
}

describe("createTree", () => {
  test("stores metadata under the QinoMeta symbol with defaults applied", () => {
    const tree = createTree({
      directory: "/docs",
      schema: Schema,
      extension: ".md",
      titleField: "title",
    });

    const meta = tree[QinoMeta];
    expect(meta.is).toBe(QinoPrimitives.tree);
    expect(meta.directory).toBe("/docs");
    expect(meta.extension).toBe(".md");
    expect(meta.titleField).toBe("title");
    expect(meta.orderFileName).toBe("_order.json");
    expect(meta.relations).toEqual({});
    expect(meta.resolveRelations).toBe(true);
  });

  test("honours a custom orderFileName", () => {
    const tree = createTree({
      directory: "/docs",
      schema: Schema,
      extension: ".md",
      titleField: "title",
      orderFileName: "sidebar.json",
    });
    expect(tree[QinoMeta].orderFileName).toBe("sidebar.json");
  });

  test("getTree() returns the full hierarchical structure", async () => {
    const docs = nodePath.join(tmp, "docs");
    await fs.mkdir(docs);
    await writeMd(docs, "introduction", "Introduction");
    await writeMd(docs, "guides", "Guides");
    const guidesDir = nodePath.join(docs, "guides");
    await fs.mkdir(guidesDir);
    await writeMd(guidesDir, "queries", "Queries");

    const tree = createTree({
      directory: "/docs",
      schema: Schema,
      extension: ".md",
      titleField: "title",
    });

    const nodes = await tree.getTree();
    expect(nodes.map((n) => n.slug).sort()).toEqual(["guides", "introduction"]);
    const guides = nodes.find((n) => n.slug == "guides");
    if (!guides) throw new Error("Guides node not found");

    expect(guides.children.map((c) => c.slug)).toEqual(["guides/queries"]);
  });

  test("getTree(slug) returns the matching subtree", async () => {
    const docs = nodePath.join(tmp, "docs");
    await fs.mkdir(docs);
    await writeMd(docs, "introduction", "Introduction");
    await writeMd(docs, "guides", "Guides");
    const guidesDir = nodePath.join(docs, "guides");
    await fs.mkdir(guidesDir);
    await writeMd(guidesDir, "queries", "Queries");

    const tree = createTree({
      directory: "/docs",
      schema: Schema,
      extension: ".md",
      titleField: "title",
    });

    const subtree = await tree.getTree("guides/queries");
    expect(subtree.slug).toBe("guides/queries");
    expect(subtree.title).toBe("Queries");
  });

  test("getTree(slug) throws when the slug does not exist", async () => {
    const docs = nodePath.join(tmp, "docs");
    await fs.mkdir(docs);
    await writeMd(docs, "introduction", "Introduction");

    const tree = createTree({
      directory: "/docs",
      schema: Schema,
      extension: ".md",
      titleField: "title",
    });

    await expect(tree.getTree("nope")).rejects.toThrow(
      /Tree entry "nope" not found in tree "\/docs"/,
    );
  });

  test("getEntry() returns the validated entry with _meta", async () => {
    const docs = nodePath.join(tmp, "docs");
    await fs.mkdir(docs);
    await writeMd(docs, "introduction", "Introduction", "Welcome");

    const tree = createTree({
      directory: "/docs",
      schema: Schema,
      extension: ".md",
      titleField: "title",
    });

    const entry = await tree.getEntry("introduction");
    expect(entry._meta.slug).toBe("introduction");
    expect(entry._meta.fileName).toBe("introduction.md");
    expect((entry as { title: string }).title).toBe("Introduction");
    expect(
      (entry as { [MARKDOWN_BODY_FIELD_NAME]: string })[
        MARKDOWN_BODY_FIELD_NAME
      ].trim(),
    ).toBe("Welcome");
  });

  test("getEntry() resolves a nested slug to the correct file", async () => {
    const docs = nodePath.join(tmp, "docs");
    await fs.mkdir(docs);
    const guidesDir = nodePath.join(docs, "guides");
    await fs.mkdir(guidesDir);
    const queriesDir = nodePath.join(guidesDir, "queries");
    await fs.mkdir(queriesDir);
    await writeMd(queriesDir, "basics", "Basics", "Body");

    const tree = createTree({
      directory: "/docs",
      schema: Schema,
      extension: ".md",
      titleField: "title",
    });

    const entry = await tree.getEntry("guides/queries/basics");
    expect(entry._meta.slug).toBe("guides/queries/basics");
    expect(entry._meta.fileName).toBe("basics.md");
    expect(entry._meta.filePath.endsWith("guides/queries/basics.md")).toBe(
      true,
    );
    expect((entry as { title: string }).title).toBe("Basics");
  });

  test("getEntry() throws when the slug does not exist", async () => {
    const docs = nodePath.join(tmp, "docs");
    await fs.mkdir(docs);

    const tree = createTree({
      directory: "/docs",
      schema: Schema,
      extension: ".md",
      titleField: "title",
    });

    await expect(tree.getEntry("missing")).rejects.toThrow();
  });

  test("getEntry() with resolveRelations: false skips relation resolution", async () => {
    const docs = nodePath.join(tmp, "docs");
    await fs.mkdir(docs);
    await writeMd(docs, "intro", "Intro");

    const tree = createTree({
      directory: "/docs",
      schema: Schema,
      extension: ".md",
      titleField: "title",
    });

    const entry = await tree.getEntry("intro", { resolveRelations: false });
    expect(entry._meta.slug).toBe("intro");
  });

  describe("getNextNode / getPreviousNode", () => {
    async function setupNested() {
      const docs = nodePath.join(tmp, "docs");
      await fs.mkdir(docs);
      await writeMd(docs, "introduction", "Introduction");
      await writeMd(docs, "guides", "Guides");
      const guidesDir = nodePath.join(docs, "guides");
      await fs.mkdir(guidesDir);
      await writeMd(guidesDir, "queries", "Queries");
      await writeMd(guidesDir, "mutations", "Mutations");
      await writeMd(docs, "reference", "Reference");
      await fs.writeFile(
        nodePath.join(docs, "_order.json"),
        JSON.stringify(["introduction.md", "guides.md", "reference.md"]),
      );
      await fs.writeFile(
        nodePath.join(guidesDir, "_order.json"),
        JSON.stringify(["queries.md", "mutations.md"]),
      );

      return createTree({
        directory: "/docs",
        schema: Schema,
        extension: ".md",
        titleField: "title",
      });
    }

    test("getNextNode(slug) returns the next node in depth-first order", async () => {
      const tree = await setupNested();
      const next = await tree.getNextNode("introduction");
      expect(next?.slug).toBe("guides");
    });

    test("getNextNode descends into children of a parent node", async () => {
      const tree = await setupNested();
      const next = await tree.getNextNode("guides");
      expect(next?.slug).toBe("guides/queries");
    });

    test("getNextNode crosses out of a nested branch to the next uncle", async () => {
      const tree = await setupNested();
      const next = await tree.getNextNode("guides/mutations");
      expect(next?.slug).toBe("reference");
    });

    test("getNextNode returns null at the last node", async () => {
      const tree = await setupNested();
      expect(await tree.getNextNode("reference")).toBeNull();
    });

    test("getPreviousNode returns null at the first node", async () => {
      const tree = await setupNested();
      expect(await tree.getPreviousNode("introduction")).toBeNull();
    });

    test("getPreviousNode returns the previous node in depth-first order", async () => {
      const tree = await setupNested();
      const prev = await tree.getPreviousNode("reference");
      expect(prev?.slug).toBe("guides/mutations");
    });

    test("accepts an entry object instead of a slug", async () => {
      const tree = await setupNested();
      const entry = await tree.getEntry("introduction");
      const next = await tree.getNextNode(entry);
      expect(next?.slug).toBe("guides");
    });

    test("throws when slug does not exist", async () => {
      const tree = await setupNested();
      await expect(tree.getNextNode("nope")).rejects.toThrow(
        /Tree entry "nope" not found in tree "\/docs"/,
      );
    });
  });
});
