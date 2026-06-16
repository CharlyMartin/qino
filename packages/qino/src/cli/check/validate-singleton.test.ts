import { describe, expect, test } from "vitest";

import { makeDummySingleton } from "../../utils/tests";
import { validateSingleton } from "./validate-singleton";

describe("validateSingleton", () => {
  test("resolves when getData succeeds", async () => {
    const singleton = makeDummySingleton({ file: "/settings.json" });

    await expect(validateSingleton(singleton)).resolves.toBeUndefined();
  });

  test("wraps getData errors with the singleton file", async () => {
    const singleton = makeDummySingleton({ file: "/settings.json" });
    singleton.getData = (async () => {
      throw new Error("missing field");
    }) as typeof singleton.getData;

    await expect(validateSingleton(singleton)).rejects.toThrow(
      `Singleton "/settings.json" failed validation: missing field`,
    );
  });
});
