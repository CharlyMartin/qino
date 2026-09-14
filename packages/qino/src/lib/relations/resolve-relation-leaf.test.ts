import { describe, expect, test } from "vitest";

import { QinoPrimitiveMarker } from "../../data/globals";
import { makeDummyCollection, makeDummyItem } from "../../utils/tests";
import { resolveRelationLeaf } from "./resolve-relation-leaf";

const baseCtx = () => ({
  relationKey: "author",
  sourceFilePath: "/fixtures/post.json",
  resolveTargetReference: async (slug: string) => ({ slug }),
});

describe("resolveRelationLeaf", () => {
  test("rejects a numeric leaf with the typeof in the message", async () => {
    const targetMeta = makeDummyCollection({
      directory: "/authors",
      extension: ".json",
    })[QinoPrimitiveMarker];
    await expect(
      resolveRelationLeaf(42, { ...baseCtx(), targetMeta }),
    ).rejects.toThrow(/author.*post\.json.*number/);
  });

  test("rejects a null leaf (typeof null is 'object')", async () => {
    const targetMeta = makeDummyCollection({
      directory: "/authors",
      extension: ".json",
    })[QinoPrimitiveMarker];
    await expect(
      resolveRelationLeaf(null, { ...baseCtx(), targetMeta }),
    ).rejects.toThrow(/author.*post\.json.*object/);
  });

  test("rejects an empty-string leaf with a dedicated message", async () => {
    const targetMeta = makeDummyCollection({
      directory: "/authors",
      extension: ".json",
    })[QinoPrimitiveMarker];
    await expect(
      resolveRelationLeaf("", { ...baseCtx(), targetMeta }),
    ).rejects.toThrow(/empty relation reference.*author.*post\.json/i);
  });

  test("parses a collection reference and delegates target resolution", async () => {
    const targetMeta = makeDummyCollection({
      directory: "/authors",
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
      file: "/config/site.json",
      data: { siteName: "Qino" },
    })[QinoPrimitiveMarker];
    const result = await resolveRelationLeaf("config/site.json", {
      ...baseCtx(),
      targetMeta,
    });
    expect(result).toMatchObject({ slug: "config/site.json" });
  });

  test("tolerates a leading slash on the reference value", async () => {
    const targetMeta = makeDummyCollection({
      directory: "/authors",
      extension: ".json",
    })[QinoPrimitiveMarker];
    const result = await resolveRelationLeaf("/authors/alice.json", {
      ...baseCtx(),
      targetMeta,
    });
    expect(result).toMatchObject({ slug: "alice" });
  });

  test("propagates a prefix mismatch error from parseRelationValue", async () => {
    const targetMeta = makeDummyCollection({
      directory: "/authors",
      extension: ".json",
    })[QinoPrimitiveMarker];
    await expect(
      resolveRelationLeaf("posts/alice.json", { ...baseCtx(), targetMeta }),
    ).rejects.toThrow(/expected value under "authors\/".*posts\/alice\.json/);
  });
});
