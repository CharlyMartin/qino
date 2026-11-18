import { describe, expect, test, vi } from "vitest";

import { createDerivedCache } from "./create-derived-cache";

type Source = { title: string };

function makeDerive() {
  return vi.fn(async (source: Source) => source.title.toUpperCase());
}

describe("createDerivedCache", () => {
  test("derives once per source object", async () => {
    const cache = createDerivedCache();
    const derive = makeDerive();
    const source = { title: "hello" };

    expect(await cache.read(source, derive)).toBe("HELLO");
    expect(await cache.read(source, derive)).toBe("HELLO");
    expect(derive).toHaveBeenCalledTimes(1);
  });

  test("shares one pending value between concurrent reads", async () => {
    const cache = createDerivedCache();
    const derive = makeDerive();
    const source = { title: "hello" };

    await Promise.all([cache.read(source, derive), cache.read(source, derive)]);
    expect(derive).toHaveBeenCalledTimes(1);
  });

  test("derives again for a new source, even with equal content", async () => {
    const cache = createDerivedCache();
    const derive = makeDerive();

    await cache.read({ title: "hello" }, derive);
    await cache.read({ title: "hello" }, derive);
    expect(derive).toHaveBeenCalledTimes(2);
  });

  test("drops a rejected value so the next read derives it again", async () => {
    const cache = createDerivedCache();
    const failure = new Error("Toc failed");
    const derive = vi
      .fn<(source: object) => Promise<string>>()
      .mockRejectedValueOnce(failure)
      .mockResolvedValueOnce("recovered");
    const source = { title: "hello" };

    await expect(cache.read(source, derive)).rejects.toBe(failure);
    expect(await cache.read(source, derive)).toBe("recovered");
    expect(derive).toHaveBeenCalledTimes(2);
  });
});
