import { describe, expect, test } from "vitest";

import { parseSize } from "./parse-size";

describe("parseSize", () => {
  test.each([
    ["50KB", 50 * 1024],
    ["600KB", 600 * 1024],
    ["950KB", 950 * 1024],
    ["1MB", 1024 * 1024],
    ["5MB", 5 * 1024 * 1024],
    ["100MB", 100 * 1024 * 1024],
  ])("converts %s to bytes", (size, bytes) => {
    expect(parseSize(size)).toBe(bytes);
  });

  test.each([
    "999B",
    "25KB",
    "975KB",
    "1000KB",
    "0MB",
    "101MB",
    "1GB",
    "05MB",
    "1.5MB",
    "-1MB",
    "5mb",
    "5 MB",
    "5",
    "",
  ])("rejects %s", (size) => {
    expect(parseSize(size)).toBeUndefined();
  });
});
