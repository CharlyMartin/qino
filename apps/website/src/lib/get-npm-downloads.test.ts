import { afterEach, expect, test, vi } from "vitest";

import { getNpmDownloads } from "./get-npm-downloads";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.useRealTimers();
});

// npm's `last-month` alias has been stuck on June 2026, before the first publish.
test("asks for the 30 days ending yesterday", async () => {
  vi.useFakeTimers({ now: new Date("2026-10-27T09:00:00Z") });
  const fetch = vi.fn(async () => Response.json({ downloads: 1363 }));
  vi.stubGlobal("fetch", fetch);
  await getNpmDownloads();
  expect(fetch).toHaveBeenCalledWith(
    "https://api.npmjs.org/downloads/point/2026-09-27:2026-10-26/@qino/cms",
    { signal: undefined },
  );
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
