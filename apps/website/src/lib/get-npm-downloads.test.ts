import { afterEach, expect, test, vi } from "vitest";

import { getNpmDownloads } from "./get-npm-downloads";

afterEach(() => {
  vi.unstubAllGlobals();
});

test("returns last month's download count", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => Response.json({ downloads: 1363 })),
  );
  await expect(getNpmDownloads()).resolves.toBe(1363);
});

test("throws when npm responds with an error", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(null, { status: 503 })),
  );
  await expect(getNpmDownloads()).rejects.toThrow("npm responded 503");
});
