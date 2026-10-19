import { afterEach, expect, test, vi } from "vitest";

import { getGithubStars } from "./get-github-stars";

afterEach(() => {
  vi.unstubAllGlobals();
});

test("returns the repo star count", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => Response.json({ stargazers_count: 12 })),
  );
  await expect(getGithubStars()).resolves.toBe(12);
});

test("sends the token when given one", async () => {
  const fetch = vi.fn(async () => Response.json({ stargazers_count: 12 }));
  vi.stubGlobal("fetch", fetch);
  await getGithubStars({ token: "secret" });
  expect(fetch).toHaveBeenCalledWith(
    expect.any(String),
    expect.objectContaining({
      headers: { Authorization: "Bearer secret" },
    }),
  );
});

test("throws when GitHub responds with an error", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => new Response(null, { status: 403 })),
  );
  await expect(getGithubStars()).rejects.toThrow("GitHub responded 403");
});
