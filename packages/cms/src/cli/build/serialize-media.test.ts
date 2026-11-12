import { describe, expect, test } from "vitest";

import { serializeMedia } from "./serialize-media";

describe("serializeMedia", () => {
  test("converts sizes to bytes", () => {
    expect(
      serializeMedia(
        {
          cover: { accepted: "image/webp", maxSize: "5MB" },
          attachment: { accepted: "application/pdf", maxSize: "600KB" },
        },
        [
          { accepted: "image/webp", maxSize: "1MB" },
          { accepted: "image/png", maxSize: "2MB" },
        ],
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
    expect(serializeMedia({}, [], "posts")).toEqual({});
  });

  test("marks rules with a parse callback", () => {
    expect(
      serializeMedia(
        {
          cover: {
            accepted: "image/webp",
            maxSize: "5MB",
            parse: (value) => value,
          },
        },
        [{ accepted: "image/png", maxSize: "1MB", parse: () => undefined }],
        "posts",
      ),
    ).toEqual({
      cover: { accepted: "image/webp", maxSize: 5242880, parse: true },
      markdown: [{ accepted: "image/png", maxSize: 1048576, parse: true }],
    });
  });

  test("leaves parse out of rules without one", () => {
    expect(
      serializeMedia(
        { cover: { accepted: "image/webp", maxSize: "5MB" } },
        [{ accepted: "image/png", maxSize: "1MB" }],
        "posts",
      ),
    ).toEqual({
      cover: { accepted: "image/webp", maxSize: 5242880 },
      markdown: [{ accepted: "image/png", maxSize: 1048576 }],
    });
  });

  test.each(["image/*", "*/*", "image/wep", "webp"])(
    "rejects a field accepting %s",
    (accepted) => {
      expect(() =>
        serializeMedia({ cover: { accepted, maxSize: "5MB" } }, [], "posts"),
      ).toThrow(
        `media "cover" of "posts" accepts "${accepted}", which isn't a known MIME type.`,
      );
    },
  );

  test("rejects a field accepting several types", () => {
    expect(() =>
      serializeMedia(
        { cover: { accepted: ["image/webp"] as never, maxSize: "5MB" } },
        [],
        "posts",
      ),
    ).toThrow('accepts ["image/webp"], which isn\'t a known MIME type');
  });

  test("rejects unknown types in markdown.media rules", () => {
    expect(() =>
      serializeMedia(
        {},
        [
          { accepted: "image/png", maxSize: "1MB" },
          { accepted: "image/*", maxSize: "1MB" },
        ],
        "posts",
      ),
    ).toThrow(
      'markdown.media of "posts", rule 2, accepts "image/*", which isn\'t a known MIME type.',
    );
  });

  test("rejects a markdown.media rule accepting several types", () => {
    expect(() =>
      serializeMedia(
        {},
        [{ accepted: ["image/png", "image/jpeg"] as never, maxSize: "1MB" }],
        "posts",
      ),
    ).toThrow(
      'markdown.media of "posts", rule 1, accepts ["image/png","image/jpeg"], which isn\'t a known MIME type.',
    );
  });

  test.each(["101MB", "25KB", "1.5MB", "5mb"])(
    "rejects maxSize %s",
    (maxSize) => {
      expect(() =>
        serializeMedia(
          { cover: { accepted: "image/png", maxSize: maxSize as never } },
          [],
          "posts",
        ),
      ).toThrow(
        `media "cover" of "posts" has maxSize "${maxSize}". Use 50–950KB in steps of 50, or 1–100MB.`,
      );
    },
  );
});
