import { describe, expect, test } from "vitest";

import { augmentEntry } from "./augment-entry";

describe("augmentEntry", () => {
  const entry = {
    _meta: { filePath: "/content/posts/hello.md" },
    title: "Hello",
  };

  test("merges a synchronous augment result", async () => {
    await expect(
      augmentEntry(entry, ({ title }) => ({ upperTitle: title.toUpperCase() })),
    ).resolves.toEqual({ ...entry, upperTitle: "HELLO" });
  });

  test("includes the source path when augment throws", async () => {
    await expect(
      augmentEntry(entry, () => {
        throw new Error("could not derive a summary");
      }),
    ).rejects.toThrow(
      "/content/posts/hello.md: augment failed: could not derive a summary",
    );
  });

  test("rejects non-object results and field collisions", async () => {
    await expect(
      augmentEntry(entry, () => [] as unknown as Record<string, unknown>),
    ).rejects.toThrow(
      "/content/posts/hello.md: augment must return an object.",
    );

    await expect(
      augmentEntry(entry, () => ({ title: "Replacement" })),
    ).rejects.toThrow(
      "/content/posts/hello.md: augment cannot add reserved or overwrite existing fields: title.",
    );
  });
});
