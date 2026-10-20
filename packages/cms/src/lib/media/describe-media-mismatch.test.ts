import { describe, expect, test } from "vitest";

import { describeMediaMismatch } from "./describe-media-mismatch";

const KB = 1024;
const MB = 1024 * KB;
const webp = { accepted: "image/webp", maxSize: MB };
const rules = [webp, { accepted: "image/png", maxSize: 50 * KB }];

describe("describeMediaMismatch", () => {
  test("returns undefined when a rule matches", () => {
    expect(
      describeMediaMismatch({ type: "image/png", size: 10 * KB, rules }),
    ).toBeUndefined();
  });

  test("lists the accepted types", () => {
    expect(describeMediaMismatch({ type: "image/jpeg", size: 10, rules })).toBe(
      "is image/jpeg, but only image/webp, image/png are accepted.",
    );
    expect(
      describeMediaMismatch({ type: undefined, size: 10, rules: [webp] }),
    ).toBe("is of an unknown type, but only image/webp is accepted.");
  });

  test("reports the size against the largest limit of its type", () => {
    expect(
      describeMediaMismatch({ type: "image/png", size: 51 * KB, rules }),
    ).toBe("is 51KB, over the 50KB limit.");
    expect(
      describeMediaMismatch({ type: "image/webp", size: 1.5 * MB, rules }),
    ).toBe("is 1.5MB, over the 1MB limit.");
  });
});
