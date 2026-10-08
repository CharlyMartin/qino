import { initQino } from "@qino/cms";
import { expectTypeOf, test } from "vitest";
import { z } from "zod";

const qino = initQino({
  contentFolder: "content",
  media: { folder: "public" },
});
const schema = z.object({ title: z.string() });

test("accepts content paths without a leading slash", () => {
  const posts = qino.defineCollection({
    directory: "posts",
    extension: ".md",
    schema,
  });
  const home = qino.defineItem({ file: "pages/home.md", schema });
  const docs = qino.defineTree({
    directory: "docs",
    extension: ".md",
    titleField: "title",
    schema,
  });

  expectTypeOf(posts.getAllSlugs).returns.resolves.toEqualTypeOf<
    Array<string>
  >();
  expectTypeOf(home.getEntry).toBeFunction();
  expectTypeOf(docs.getTree).toBeFunction();
});

test("rejects a leading slash on all three primitives", () => {
  qino.defineCollection({
    // @ts-expect-error content paths must not start with "/".
    directory: "/posts",
    extension: ".md",
    schema,
  });
  qino.defineItem({
    // @ts-expect-error content paths must not start with "/".
    file: "/pages/home.md",
    schema,
  });
  qino.defineTree({
    // @ts-expect-error content paths must not start with "/".
    directory: "/docs",
    extension: ".md",
    titleField: "title",
    schema,
  });
});
