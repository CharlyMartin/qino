import { describe, expect, test } from "vitest";

import type { CloudMediaSize } from "../../types/cloud";
import { serializeAcceptedMedia } from "./serialize-accepted-media";

describe("serializeAcceptedMedia", () => {
  test.each([
    "image/webp",
    "image/*",
    "*/*",
    "image/svg+xml",
    "application/vnd.ms-excel",
  ])("accepts %s", (type) => {
    expect(
      serializeAcceptedMedia([{ type, maxSize: "50KB" }], "initQino"),
    ).toEqual([{ type, maxSize: 51200 }]);
  });

  test("converts maxSize to bytes", () => {
    expect(
      serializeAcceptedMedia(
        [
          { type: "image/png", maxSize: "5MB" },
          { type: "image/webp", maxSize: "600KB" },
        ],
        "initQino",
      ),
    ).toEqual([
      { type: "image/png", maxSize: 5242880 },
      { type: "image/webp", maxSize: 614400 },
    ]);
  });

  test("keeps an empty list", () => {
    expect(serializeAcceptedMedia([], "initQino")).toEqual([]);
  });

  test.each(["webp", "image/", "image/webp/x", ".png"])(
    "rejects %s",
    (type) => {
      expect(() =>
        serializeAcceptedMedia([{ type, maxSize: "50KB" }], '"posts"'),
      ).toThrow(`media.accepted type "${type}" of "posts" isn't a MIME type`);
    },
  );

  test.each(["101MB", "25KB", "1.5MB", "5mb"])(
    "rejects maxSize %s",
    (maxSize) => {
      expect(() =>
        serializeAcceptedMedia(
          [{ type: "image/png", maxSize: maxSize as CloudMediaSize }],
          "initQino",
        ),
      ).toThrow(
        `media.accepted maxSize "${maxSize}" of "image/png" in initQino must be 50–950KB in steps of 50, or 1–100MB.`,
      );
    },
  );
});
