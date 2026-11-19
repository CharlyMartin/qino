import { describe, expect, test } from "vitest";

import { assertSiteUrl } from "./assert-site-url";

describe("assertSiteUrl", () => {
  test.each([
    undefined,
    "https://example.com",
    "https://example.com/",
    "http://localhost:3000",
  ])("accepts %j", (siteUrl) => {
    expect(() => assertSiteUrl(siteUrl)).not.toThrow();
  });

  test.each([
    "example.com",
    "ftp://example.com",
    "https://example.com/docs",
    "https://example.com/?ref=1",
    "https://example.com/#top",
    "https://user@example.com",
  ])("rejects %j", (siteUrl) => {
    expect(() => assertSiteUrl(siteUrl)).toThrow(
      `siteUrl "${siteUrl}" must be an http(s) origin, such as "https://example.com".`,
    );
  });
});
