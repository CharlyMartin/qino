import { describe, expect, test } from "vitest";

import { augmentEntry } from "./augment-entry";

type Output = Record<string, unknown>;

describe("augmentEntry", () => {
  const entry = {
    _meta: { filePath: "/content/posts/hello.md" },
    title: "Hello",
  };

  test("returns the entry itself without augment", () => {
    expect(augmentEntry(entry)).toBe(entry);
  });

  test("merges a synchronous augment result without a promise", () => {
    const result = augmentEntry(entry, ({ title }) => ({
      upperTitle: title.toUpperCase(),
    }));

    expect(result).not.toBeInstanceOf(Promise);
    expect(result).toEqual({ ...entry, upperTitle: "HELLO" });
  });

  test("merges an asynchronous augment result", async () => {
    const result = augmentEntry(entry, async ({ title }) => ({
      upperTitle: title.toUpperCase(),
    }));

    expect(result).toBeInstanceOf(Promise);
    await expect(result).resolves.toEqual({ ...entry, upperTitle: "HELLO" });
  });

  test("checks a synchronous result right away, and an asynchronous one once settled", async () => {
    const message =
      "/content/posts/hello.md: augment cannot add reserved or overwrite existing fields: title.";

    expect(() => augmentEntry(entry, () => ({ title: "Replacement" }))).toThrow(
      message,
    );
    await expect(
      augmentEntry(entry, async () => ({ title: "Replacement" })),
    ).rejects.toThrow(message);
  });

  test("includes the source path when augment throws or rejects", async () => {
    const failure = new Error("could not derive a summary");
    const message =
      "/content/posts/hello.md: augment failed: could not derive a summary";

    expect(() =>
      augmentEntry(entry, () => {
        throw failure;
      }),
    ).toThrow(message);
    await expect(
      augmentEntry(entry, async () => {
        throw failure;
      }),
    ).rejects.toThrow(message);
    await expect(
      augmentEntry(entry, () => Promise.reject("boom")),
    ).rejects.toThrow("/content/posts/hello.md: augment failed: boom");
  });

  test("keeps the original error as cause", async () => {
    const failure = new Error("nope");
    let syncError: unknown;
    try {
      augmentEntry(entry, () => {
        throw failure;
      });
    } catch (error) {
      syncError = error;
    }
    const asyncError = await (
      augmentEntry(entry, () => Promise.reject(failure)) as Promise<unknown>
    ).catch((error: unknown) => error);

    expect((syncError as Error).cause).toBe(failure);
    expect((asyncError as Error).cause).toBe(failure);
  });

  describe("thenable results, handled as await handles them", () => {
    test("wraps a then getter that throws, like any augment failure", async () => {
      const output = {
        // biome-ignore lint/suspicious/noThenProperty: a thenable augment output
        get then() {
          throw new Error("then exploded");
        },
      };

      await expect(
        augmentEntry(entry, () => output as unknown as Output),
      ).rejects.toThrow(
        "/content/posts/hello.md: augment failed: then exploded",
      );
    });

    test("reads a then getter once", async () => {
      let reads = 0;
      const output = {
        // biome-ignore lint/suspicious/noThenProperty: a thenable augment output
        get then() {
          reads += 1;
          return reads == 1
            ? (resolve: (value: unknown) => void) => resolve({ summary: "Hi" })
            : undefined;
        },
      };

      await expect(
        augmentEntry(entry, () => output as unknown as Output),
      ).resolves.toEqual({ ...entry, summary: "Hi" });
      expect(reads).toBe(1);
    });

    test("calls then in a later microtask, after work augment queued first", async () => {
      let summary = "not ready";
      const output = {
        // biome-ignore lint/suspicious/noThenProperty: a thenable augment output
        then(resolve: (value: unknown) => void) {
          resolve({ summary });
        },
      };

      const result = augmentEntry(entry, () => {
        queueMicrotask(() => {
          summary = "ready";
        });
        return output as unknown as Output;
      });

      await expect(result).resolves.toEqual({ ...entry, summary: "ready" });
    });

    test("waits for a native promise even when its own then is overridden", async () => {
      const promise = Promise.resolve({ summary: "Hi" });
      // biome-ignore lint/suspicious/noThenProperty: overrides a native promise's then
      Object.defineProperty(promise, "then", { value: undefined });

      await expect(
        augmentEntry(entry, () => promise as unknown as Output),
      ).resolves.toEqual({ ...entry, summary: "Hi" });
    });

    test("merges an object whose then isn't callable, once awaited", async () => {
      // biome-ignore lint/suspicious/noThenProperty: a then field that isn't a method
      const output = { then: "later" };

      await expect(augmentEntry(entry, () => output)).resolves.toEqual({
        ...entry,
        ...output,
      });
    });
  });
});
