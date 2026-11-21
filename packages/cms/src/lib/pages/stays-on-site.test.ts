import { describe, expect, test } from "vitest";

import { staysOnSite } from "./stays-on-site";

describe("staysOnSite", () => {
  test.each(["/", "/blog", "/blog/x.md", "/a%2F%2Fb"])("accepts %j", (path) => {
    expect(staysOnSite(path)).toBe(true);
  });

  test.each(["//evil.com", "/\\evil.com", "/\t/evil.com", "/\n/evil.com"])(
    "rejects %j, which a URL reads as another host",
    (path) => {
      expect(staysOnSite(path)).toBe(false);
    },
  );
});
