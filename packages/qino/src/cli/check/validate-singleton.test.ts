import { describe, expect, test, vi } from "vitest";

import { QinoPrimitiveMarker } from "../../data";
import { makeDummySingleton } from "../../utils/tests";
import { validateSingleton } from "./validate-singleton";

describe("validateSingleton", () => {
  test("resolves when source reading succeeds", async () => {
    const singleton = makeDummySingleton({ file: "/settings.json" });

    await expect(validateSingleton(singleton)).resolves.toBeUndefined();
  });

  test("wraps source reading errors with the singleton file", async () => {
    const singleton = makeDummySingleton({ file: "/settings.json" });
    vi.spyOn(singleton[QinoPrimitiveMarker], "readData").mockRejectedValue(
      new Error("missing field"),
    );

    await expect(validateSingleton(singleton)).rejects.toThrow(
      `Singleton "/settings.json" failed validation: missing field`,
    );
  });
});
