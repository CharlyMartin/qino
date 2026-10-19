import { afterEach, expect, test, vi } from "vitest";

import { fetchProjectStats } from "./fetch-project-stats";

afterEach(() => {
  vi.unstubAllGlobals();
});

test("returns both counts", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) =>
      url.includes("github")
        ? Response.json({ stargazers_count: 12 })
        : Response.json({ downloads: 1363 }),
    ),
  );
  await expect(fetchProjectStats()).resolves.toEqual({
    stars: 12,
    downloads: 1363,
  });
});

test("nulls a failed count without dropping the other", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url: string) =>
      url.includes("github")
        ? new Response(null, { status: 403 })
        : Response.json({ downloads: 1363 }),
    ),
  );
  await expect(fetchProjectStats()).resolves.toEqual({
    stars: null,
    downloads: 1363,
  });
});
