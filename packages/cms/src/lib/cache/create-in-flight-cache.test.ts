import { describe, expect, test, vi } from "vitest";

import { createInFlightCache } from "./create-in-flight-cache";

function makeStart() {
  return vi.fn(async () => ({ listed: true }));
}

describe("createInFlightCache", () => {
  test("shares one run between concurrent calls with the same key", async () => {
    const cache = createInFlightCache();
    const start = makeStart();

    const [first, second] = await Promise.all([
      cache.run("default", start),
      cache.run("default", start),
    ]);

    expect(start).toHaveBeenCalledTimes(1);
    expect(second).toBe(first);
  });

  test("starts a new run once the previous one settled", async () => {
    const cache = createInFlightCache();
    const start = makeStart();

    const first = await cache.run("default", start);
    const second = await cache.run("default", start);

    expect(start).toHaveBeenCalledTimes(2);
    expect(second).not.toBe(first);
  });

  test("keeps different keys apart", async () => {
    const cache = createInFlightCache();
    const start = makeStart();

    await Promise.all([cache.run("default", start), cache.run("raw", start)]);

    expect(start).toHaveBeenCalledTimes(2);
  });

  test("shares a rejection, then retries on the next call", async () => {
    const cache = createInFlightCache();
    const failure = new Error("Read failed");
    const start = vi
      .fn<() => Promise<string>>()
      .mockRejectedValueOnce(failure)
      .mockResolvedValueOnce("recovered");

    const results = await Promise.allSettled([
      cache.run("default", start),
      cache.run("default", start),
    ]);

    expect(results).toEqual([
      { status: "rejected", reason: failure },
      { status: "rejected", reason: failure },
    ]);
    expect(await cache.run("default", start)).toBe("recovered");
    expect(start).toHaveBeenCalledTimes(2);
  });
});
