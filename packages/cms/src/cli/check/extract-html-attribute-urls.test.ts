import { describe, expect, test } from "vitest";

import { extractHtmlAttributeUrls } from "./extract-html-attribute-urls";

describe("extractHtmlAttributeUrls", () => {
  test("reads double-quoted, single-quoted, and unquoted values", () => {
    expect(
      extractHtmlAttributeUrls(
        `<video src="/a.mp4" poster='/b.jpg'></video><img SRC=/c.png>`,
      ).map(({ url }) => url),
    ).toEqual(["/a.mp4", "/b.jpg", "/c.png"]);
  });

  test("decodes character references", () => {
    expect(
      extractHtmlAttributeUrls(`<img src="/a&amp;b&#39;c.png">`)[0]?.url,
    ).toBe("/a&b'c.png");
  });

  test("keeps legacy references without a semicolon literal", () => {
    expect(
      extractHtmlAttributeUrls(`<img src="/images/rock&notroll.png">`)[0]?.url,
    ).toBe("/images/rock&notroll.png");
  });

  test("ignores comments", () => {
    expect(
      extractHtmlAttributeUrls(`<!-- <img src="/placeholder.png" /> -->`),
    ).toEqual([]);
  });

  test("ignores attribute-like text inside other values", () => {
    expect(
      extractHtmlAttributeUrls(`<img alt='src="/x.png"' src="/y.png">`),
    ).toEqual([{ url: "/y.png", lineOffset: 0, image: true }]);
  });

  test("flags the src of img only", () => {
    expect(
      extractHtmlAttributeUrls(
        `<img src="/a.png"><video poster="/b.jpg" src="/c.mp4"></video><IMG SRC="/d.png">`,
      ).map(({ url, image }) => [url, image]),
    ).toEqual([
      ["/a.png", true],
      ["/b.jpg", false],
      ["/c.mp4", false],
      ["/d.png", true],
    ]);
  });

  test("ignores other attributes", () => {
    expect(
      extractHtmlAttributeUrls(`<img data-src="/a.png" srcset="/b.png 2x">`),
    ).toEqual([]);
  });

  test("reports the line offset within multi-line tags", () => {
    expect(
      extractHtmlAttributeUrls(`<video\n  poster="/a.jpg"\n  src="/b.mp4">`),
    ).toEqual([
      { url: "/a.jpg", lineOffset: 1, image: false },
      { url: "/b.mp4", lineOffset: 2, image: false },
    ]);
  });
});
