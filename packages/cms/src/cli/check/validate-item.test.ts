import { describe, expect, test, vi } from "vitest";

import { QinoPrimitiveMarker } from "../../data/globals";
import { makeDummyItem } from "../../test-utils/make-dummy-item";
import { validateItem } from "./validate-item";

describe("validateItem", () => {
  test("resolves when source reading succeeds", async () => {
    const item = makeDummyItem({ file: "/settings.json" });

    await expect(validateItem(item)).resolves.toBeUndefined();
  });

  test("wraps source reading errors with the item file", async () => {
    const item = makeDummyItem({ file: "/settings.json" });
    vi.spyOn(item[QinoPrimitiveMarker], "readData").mockRejectedValue(
      new Error("missing field"),
    );

    await expect(validateItem(item)).rejects.toThrow(
      `Item "/settings.json" failed validation: missing field`,
    );
  });
});
