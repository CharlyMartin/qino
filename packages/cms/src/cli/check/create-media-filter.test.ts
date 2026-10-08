import { describe, expect, test } from "vitest";

import { createMediaFilter } from "./create-media-filter";

describe("createMediaFilter", () => {
  test("accepts urls with a file extension", () => {
    const isCheckedMedia = createMediaFilter();

    expect(isCheckedMedia("/a.png")).toBe(true);
    expect(isCheckedMedia("/videos/b.MP4")).toBe(true);
    expect(isCheckedMedia("/files/c.pdf")).toBe(true);
  });

  test("rejects extensionless urls", () => {
    const isCheckedMedia = createMediaFilter();

    expect(isCheckedMedia("/blog/post")).toBe(false);
    expect(isCheckedMedia("/api/og")).toBe(false);
    expect(isCheckedMedia("/.well-known")).toBe(false);
  });

  test("rejects urls matching an exclude glob", () => {
    const isCheckedMedia = createMediaFilter(["/og/**", "/generated/*.png"]);

    expect(isCheckedMedia("/og/post.png")).toBe(false);
    expect(isCheckedMedia("/generated/a.png")).toBe(false);
    expect(isCheckedMedia("/generated/nested/a.png")).toBe(true);
    expect(isCheckedMedia("/images/a.png")).toBe(true);
  });
});
