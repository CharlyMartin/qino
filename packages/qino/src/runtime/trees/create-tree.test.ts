import fs from "node:fs/promises";
import os from "node:os";
import nodePath from "node:path";

import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { z } from "zod";

import { QinoMeta, QinoPrimitives } from "../../data";
import { createTree } from "./create-tree";

let tmp: string;

vi.mock("./resolve-tree-directory", () => ({
  resolveTreeDirectory: async (directory: string) =>
    nodePath.join(currentContentRoot, directory),
}));

let currentContentRoot = "";

beforeEach(async () => {
  tmp = await fs.mkdtemp(nodePath.join(os.tmpdir(), "qino-tree-"));
  currentContentRoot = tmp;
});

afterEach(async () => {
  await fs.rm(tmp, { recursive: true, force: true });
});

const Schema = z.object({ title: z.string(), markdown: z.string() }).strict();

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
    const guides = nodes.find((n) => n.slug === "guides")!;
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
    expect((entry as { markdown: string }).markdown.trim()).toBe("Welcome");
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
});
