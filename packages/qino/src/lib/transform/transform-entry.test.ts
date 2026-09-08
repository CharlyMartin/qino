import { describe, expect, test } from "vitest";

import { transformEntry } from "./transform-entry";

describe("transformEntry", () => {
  const entry = {
    _meta: { filePath: "/content/posts/hello.md" },
    title: "Hello",
  };

  test("merges a synchronous transform result", async () => {
    await expect(
      transformEntry({
        entry,
        transform: ({ title }) => ({ upperTitle: title.toUpperCase() }),
      }),
    ).resolves.toEqual({ ...entry, upperTitle: "HELLO" });
  });

  test("includes the source path when a transform throws", async () => {
    await expect(
      transformEntry({
        entry,
        transform: () => {
          throw new Error("could not derive a summary");
        },
      }),
    ).rejects.toThrow(
      "/content/posts/hello.md: transform failed: could not derive a summary",
    );
  });

  test("rejects non-object results and field collisions", async () => {
    await expect(
      transformEntry({
        entry,
        transform: () => [] as unknown as Record<string, unknown>,
      }),
    ).rejects.toThrow(
      "/content/posts/hello.md: transform must return an object.",
    );

    await expect(
      transformEntry({ entry, transform: () => ({ title: "Replacement" }) }),
    ).rejects.toThrow(
      "/content/posts/hello.md: transform cannot overwrite existing fields: title.",
    );
  });
});
