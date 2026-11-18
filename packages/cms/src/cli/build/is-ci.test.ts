import { afterEach, describe, expect, test, vi } from "vitest";

import { isCi } from "./is-ci";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("isCi", () => {
  test("is false when CI is unset", () => {
    vi.stubEnv("CI", undefined);

    expect(isCi()).toBe(false);
  });

  test.each(["true", "1", "TRUE"])("is true when CI is %j", (value) => {
    vi.stubEnv("CI", value);

    expect(isCi()).toBe(true);
  });

  test.each(["", "0", "false", "False"])("is false when CI is %j", (value) => {
    vi.stubEnv("CI", value);

    expect(isCi()).toBe(false);
  });
});
