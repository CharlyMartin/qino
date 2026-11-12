import { describe, expect, test } from "vitest";

import { normalizeMediaUrl } from "./normalize-media-url";

describe("normalizeMediaUrl", () => {
  test("strips query and hash", () => {
    expect(normalizeMediaUrl("/a.png?w=100#x")).toBe("/a.png");
    expect(normalizeMediaUrl("/a.mp4#t=10")).toBe("/a.mp4");
  });

  test("decodes encoded characters", () => {
    expect(normalizeMediaUrl("/my%20image.png")).toBe("/my image.png");
  });

  test("decodes reserved characters inside path segments", () => {
    expect(normalizeMediaUrl("/images/a%23b%3Fc%26d%2Ce.png")).toBe(
      "/images/a#b?c&d,e.png",
    );
  });

  test("keeps malformed encodings as-is", () => {
    expect(normalizeMediaUrl("/100%.png")).toBe("/100%.png");
  });
});
