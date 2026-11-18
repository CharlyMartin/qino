import { describe, expect, test } from "vitest";

import { createDependencyCollector } from "./create-dependency-collector";

const trusted = { version: "1:1:1", untrusted: false };

describe("createDependencyCollector", () => {
  test("records each file once, with its observation", () => {
    const dependencies = createDependencyCollector();

    dependencies.record("/a.md", trusted);
    dependencies.record("/a.md", trusted);
    dependencies.record("/b.png", { version: "2:2:2", untrusted: false });

    expect(dependencies.isReusable()).toBe(true);
    expect([...dependencies.observations]).toEqual([
      ["/a.md", trusted],
      ["/b.png", { version: "2:2:2", untrusted: false }],
    ]);
  });

  test("isn't reusable after a read whose stat failed", () => {
    const dependencies = createDependencyCollector();

    dependencies.record("/a.md");

    expect(dependencies.isReusable()).toBe(false);
  });

  test("isn't reusable after two reads of one file saw different versions", () => {
    const dependencies = createDependencyCollector();

    dependencies.record("/a.md", trusted);
    dependencies.record("/a.md", { version: "1:2:1", untrusted: false });

    expect(dependencies.isReusable()).toBe(false);
  });

  test("keeps a file untrusted once any read distrusted it", () => {
    const dependencies = createDependencyCollector();

    dependencies.record("/a.md", trusted);
    dependencies.record("/a.md", { ...trusted, untrusted: true });
    dependencies.record("/a.md", trusted);

    expect(dependencies.observations.get("/a.md")?.untrusted).toBe(true);
    expect(dependencies.isReusable()).toBe(true);
  });

  test("merges another collector's files and its reusability", () => {
    const target = createDependencyCollector();
    target.record("/author.json", trusted);
    const entry = createDependencyCollector();
    entry.record("/post.md", trusted);

    entry.merge(target);
    expect([...entry.observations.keys()]).toEqual([
      "/post.md",
      "/author.json",
    ]);
    expect(entry.isReusable()).toBe(true);

    target.markUnreusable();
    entry.merge(target);
    expect(entry.isReusable()).toBe(false);
  });
});
