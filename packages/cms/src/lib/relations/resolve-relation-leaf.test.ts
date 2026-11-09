import { describe, expect, test, vi } from "vitest";

import { QinoPrimitiveMarker } from "../../data/globals";
import { makeDummyCollection } from "../../test-utils/make-dummy-collection";
import { makeDummyItem } from "../../test-utils/make-dummy-item";
import type { RelationParseContext } from "../../types/relations";
import { resolveRelationLeaf } from "./resolve-relation-leaf";

const baseCtx = () => ({
  relationKey: "author",
  sourceFilePath: "/fixtures/post.json",
  resolveTargetReference: async (slug: string) => ({ slug }),
});

describe("resolveRelationLeaf", () => {
  test("rejects a numeric leaf with the typeof in the message", async () => {
    const targetMeta = makeDummyCollection({
      directory: "authors",
      extension: ".json",
    })[QinoPrimitiveMarker];
    await expect(
      resolveRelationLeaf(42, { ...baseCtx(), targetMeta }),
    ).rejects.toThrow(/author.*post\.json.*number/);
  });

  test("rejects a null leaf (typeof null is 'object')", async () => {
    const targetMeta = makeDummyCollection({
      directory: "authors",
      extension: ".json",
    })[QinoPrimitiveMarker];
    await expect(
      resolveRelationLeaf(null, { ...baseCtx(), targetMeta }),
    ).rejects.toThrow(/author.*post\.json.*object/);
  });

  test("rejects an empty-string leaf with a dedicated message", async () => {
    const targetMeta = makeDummyCollection({
      directory: "authors",
      extension: ".json",
    })[QinoPrimitiveMarker];
    await expect(
      resolveRelationLeaf("", { ...baseCtx(), targetMeta }),
    ).rejects.toThrow(/empty relation reference.*author.*post\.json/i);
  });

  test("parses a collection reference and delegates target resolution", async () => {
    const targetMeta = makeDummyCollection({
      directory: "authors",
      extension: ".json",
    })[QinoPrimitiveMarker];
    const result = await resolveRelationLeaf("authors/alice.json", {
      ...baseCtx(),
      targetMeta,
    });
    expect(result).toMatchObject({ slug: "alice" });
  });

  test("parses an item reference and delegates target resolution", async () => {
    const targetMeta = makeDummyItem({
      file: "config/site.json",
      data: { siteName: "Qino" },
    })[QinoPrimitiveMarker];
    const result = await resolveRelationLeaf("config/site.json", {
      ...baseCtx(),
      targetMeta,
    });
    expect(result).toMatchObject({ slug: "config/site.json" });
  });

  test("resolves a root path through the content folder", async () => {
    const targetMeta = makeDummyCollection({
      directory: "authors",
      extension: ".json",
    })[QinoPrimitiveMarker];
    const result = await resolveRelationLeaf(
      "apps/web/src/content/authors/alice.json",
      {
        ...baseCtx(),
        targetMeta,
      },
    );
    expect(result).toMatchObject({ slug: "alice" });
  });

  test("propagates a prefix mismatch error from parseRelationValue", async () => {
    const targetMeta = makeDummyCollection({
      directory: "authors",
      extension: ".json",
    })[QinoPrimitiveMarker];
    await expect(
      resolveRelationLeaf("posts/alice.json", { ...baseCtx(), targetMeta }),
    ).rejects.toThrow(/expected value under "authors\/".*posts\/alice\.json/);
  });

  describe("parse", () => {
    const targetMeta = makeDummyCollection({
      directory: "authors",
      extension: ".md",
    })[QinoPrimitiveMarker];
    const wikilink = (value: string, ctx: RelationParseContext) => {
      const name = /^\[\[(.+)\]\]$/.exec(value)?.[1];
      if (!name || ctx.target.is == "item") return undefined;
      return `${ctx.target.directory}/${name}${ctx.target.extension}`;
    };

    test("reads the content path parse returns", async () => {
      const result = await resolveRelationLeaf("[[Jane Doe]]", {
        ...baseCtx(),
        targetMeta,
        parse: wikilink,
      });
      expect(result).toMatchObject({ slug: "Jane Doe" });
    });

    test("falls back to the raw value when parse returns undefined", async () => {
      const result = await resolveRelationLeaf("authors/alice.md", {
        ...baseCtx(),
        targetMeta,
        parse: wikilink,
      });
      expect(result).toMatchObject({ slug: "alice" });
    });

    test("passes the file, path, and target", async () => {
      const parse = vi.fn(() => undefined);
      await resolveRelationLeaf("authors/alice.md", {
        ...baseCtx(),
        targetMeta,
        parse,
      });
      expect(parse).toHaveBeenCalledWith("authors/alice.md", {
        sourceFilePath: "/fixtures/post.json",
        fieldPath: "author",
        target: {
          is: "collection",
          contentFolder: targetMeta.contentFolder,
          directory: "authors",
          extension: ".md",
        },
      });
    });

    test("passes an item target by file", async () => {
      const parse = vi.fn(() => undefined);
      const itemMeta = makeDummyItem({ file: "config/site.json" })[
        QinoPrimitiveMarker
      ];
      await resolveRelationLeaf("config/site.json", {
        ...baseCtx(),
        targetMeta: itemMeta,
        parse,
      });
      expect(parse).toHaveBeenCalledWith(
        "config/site.json",
        expect.objectContaining({
          target: {
            is: "item",
            contentFolder: itemMeta.contentFolder,
            file: "config/site.json",
          },
        }),
      );
    });

    test("names the raw value when the parsed path breaks the conventions", async () => {
      await expect(
        resolveRelationLeaf("[[Jane Doe]]", {
          ...baseCtx(),
          targetMeta,
          parse: () => "people/Jane Doe.md",
        }),
      ).rejects.toThrow(
        /parsed from "\[\[Jane Doe\]\]".*expected value under "authors\/".*people\/Jane Doe\.md/,
      );
    });
  });
});
