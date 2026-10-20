import { describe, expect, test } from "vitest";

import { assertMediaType } from "./assert-media-type";

describe("assertMediaType", () => {
  test.each(["image/webp", "image/svg+xml", "application/pdf", "video/mp4"])(
    "accepts %s",
    (type) => {
      expect(() => assertMediaType(type, '"posts"')).not.toThrow();
    },
  );

  test.each(["image/*", "*/*", "image/wep", "webp", 5, undefined])(
    "rejects %s",
    (type) => {
      expect(() => assertMediaType(type, '"posts"')).toThrow(
        `"posts" accepts ${JSON.stringify(type)}, which isn't a known MIME type. Use an exact type, e.g. "image/webp".`,
      );
    },
  );
});
