import { describe, expect, test } from "vitest";
import { z } from "zod";

import { initQino } from "../../runtime/qino/init-qino";
import { getPrimitiveId } from "./get-primitive-id";

const qino = initQino({
  contentFolder: "content",
  mediaFolder: "public",
});
const schema = z.object({ title: z.string() });

describe("getPrimitiveId", () => {
  test("uses the directory for collections", () => {
    const collection = qino.defineCollection({
      directory: "posts",
      schema,
      extension: ".md",
    });

    expect(getPrimitiveId(collection)).toBe("posts");
  });

  test("uses the directory for trees", () => {
    const tree = qino.defineTree({
      directory: "docs/v1",
      schema,
      extension: ".mdx",
      titleField: "title",
    });

    expect(getPrimitiveId(tree)).toBe("docs/v1");
  });

  test("uses the file for items", () => {
    const item = qino.defineItem({ file: "pages/home.md", schema });

    expect(getPrimitiveId(item)).toBe("pages/home.md");
  });
});
