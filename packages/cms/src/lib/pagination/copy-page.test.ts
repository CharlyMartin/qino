import { describe, expect, test } from "vitest";

import { copyPage } from "./copy-page";

describe("copyPage", () => {
  test("copies each entry's top-level fields and keeps the page counts", () => {
    const tags = ["a"];
    const page = {
      entries: [{ title: "A", tags }],
      page: 2,
      perPage: 1,
      pageCount: 3,
      total: 3,
    };

    const copy = copyPage(page);
    const [entry] = copy.entries;
    if (entry) entry.title = "Changed";

    expect(copy).toMatchObject({ page: 2, perPage: 1, pageCount: 3, total: 3 });
    expect(page.entries[0]?.title).toBe("A");
    expect(entry?.tags).toBe(tags);
  });
});
