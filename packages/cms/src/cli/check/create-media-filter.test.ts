import { describe, expect, test } from "vitest";

import { createMediaFilter } from "./create-media-filter";

describe("createMediaFilter", () => {
  test("accepts urls with a configured extension", () => {
    const isCheckedMedia = createMediaFilter({ extensions: ["png", ".MP4"] });

    expect(isCheckedMedia("/a.png")).toBe(true);
    expect(isCheckedMedia("/a.PNG")).toBe(true);
    expect(isCheckedMedia("/videos/b.mp4")).toBe(true);
  });

  test("rejects other extensions and extensionless urls", () => {
    const isCheckedMedia = createMediaFilter({ extensions: ["png"] });

    expect(isCheckedMedia("/blog/post.html")).toBe(false);
    expect(isCheckedMedia("/rss.xml")).toBe(false);
    expect(isCheckedMedia("/api/og")).toBe(false);
    expect(isCheckedMedia("/docs/v1.0")).toBe(false);
  });

  test("rejects urls matching an ignore glob", () => {
    const isCheckedMedia = createMediaFilter({
      extensions: ["png"],
      ignore: ["/api/**", "/generated/*.png"],
    });

    expect(isCheckedMedia("/api/og/post.png")).toBe(false);
    expect(isCheckedMedia("/generated/a.png")).toBe(false);
    expect(isCheckedMedia("/generated/nested/a.png")).toBe(true);
    expect(isCheckedMedia("/images/a.png")).toBe(true);
  });

  test("rejects everything without extensions", () => {
    expect(createMediaFilter({})("/a.png")).toBe(false);
  });
});
