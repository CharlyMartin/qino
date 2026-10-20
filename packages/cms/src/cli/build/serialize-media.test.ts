import { describe, expect, test } from "vitest";

import { serializeMedia } from "./serialize-media";

describe("serializeMedia", () => {
  test("converts sizes to bytes", () => {
    expect(
      serializeMedia(
        {
          cover: { accepted: "image/webp", maxSize: "5MB" },
          attachment: { accepted: "application/pdf", maxSize: "600KB" },
          markdown: [
            { accepted: "image/webp", maxSize: "1MB" },
            { accepted: "image/png", maxSize: "2MB" },
          ],
        },
        "posts",
      ),
    ).toEqual({
      cover: { accepted: "image/webp", maxSize: 5242880 },
      attachment: { accepted: "application/pdf", maxSize: 614400 },
      markdown: [
        { accepted: "image/webp", maxSize: 1048576 },
        { accepted: "image/png", maxSize: 2097152 },
      ],
    });
  });

  test("returns an empty object without media", () => {
    expect(serializeMedia({}, "posts")).toEqual({});
  });

  test.each(["image/*", "*/*", "image/wep", "webp"])(
    "rejects a field accepting %s",
    (accepted) => {
      expect(() =>
        serializeMedia({ cover: { accepted, maxSize: "5MB" } }, "posts"),
      ).toThrow(
        `media "cover" of "posts" accepts "${accepted}", which isn't a known MIME type.`,
      );
    },
  );

  test("rejects a field accepting several types", () => {
    expect(() =>
      serializeMedia(
        { cover: { accepted: ["image/webp"] as never, maxSize: "5MB" } },
        "posts",
      ),
    ).toThrow('accepts ["image/webp"], which isn\'t a known MIME type');
  });

  test("rejects unknown types in markdown rules", () => {
    expect(() =>
      serializeMedia(
        {
          markdown: [
            { accepted: "image/png", maxSize: "1MB" },
            { accepted: "image/*", maxSize: "1MB" },
          ],
        },
        "posts",
      ),
    ).toThrow(
      'media "markdown" of "posts", rule 2, accepts "image/*", which isn\'t a known MIME type.',
    );
  });

  test("rejects a markdown rule accepting several types", () => {
    expect(() =>
      serializeMedia(
        {
          markdown: [
            { accepted: ["image/png", "image/jpeg"] as never, maxSize: "1MB" },
          ],
        },
        "posts",
      ),
    ).toThrow(
      'media "markdown" of "posts", rule 1, accepts ["image/png","image/jpeg"], which isn\'t a known MIME type.',
    );
  });

  test("rejects markdown that isn't a list", () => {
    expect(() =>
      serializeMedia(
        { markdown: { accepted: "image/png", maxSize: "1MB" } as never },
        "posts",
      ),
    ).toThrow('media "markdown" of "posts" must be a list of rules.');
  });

  test.each(["101MB", "25KB", "1.5MB", "5mb"])(
    "rejects maxSize %s",
    (maxSize) => {
      expect(() =>
        serializeMedia(
          { cover: { accepted: "image/png", maxSize: maxSize as never } },
          "posts",
        ),
      ).toThrow(
        `media "cover" of "posts" has maxSize "${maxSize}". Use 50–950KB in steps of 50, or 1–100MB.`,
      );
    },
  );
});
