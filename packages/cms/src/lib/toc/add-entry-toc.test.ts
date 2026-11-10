import { describe, expect, test } from "vitest";

import { addEntryToc } from "./add-entry-toc";

describe("addEntryToc", () => {
  const entry = { title: "Hi", markdown: "## Install\n\n### With pnpm" };

  test("adds _toc from the markdown body", async () => {
    expect(
      await addEntryToc({ entry, markdownToc: true, extension: ".md" }),
    ).toEqual({
      ...entry,
      _toc: [
        { heading: 2, id: "install", text: "Install" },
        { heading: 3, id: "with-pnpm", text: "With pnpm" },
      ],
    });
  });

  test("stops at upTo", async () => {
    expect(
      await addEntryToc({
        entry,
        markdownToc: { upTo: "h2" },
        extension: ".md",
      }),
    ).toEqual({
      ...entry,
      _toc: [{ heading: 2, id: "install", text: "Install" }],
    });
  });

  test("parses only .mdx bodies as MDX", async () => {
    const braces = { markdown: "## Configure {name}" };

    expect(
      await addEntryToc({
        entry: braces,
        markdownToc: true,
        extension: ".mdx",
      }),
    ).toEqual({
      ...braces,
      _toc: [{ heading: 2, id: "configure-", text: "Configure" }],
    });
    expect(
      await addEntryToc({ entry: braces, markdownToc: true, extension: ".md" }),
    ).toEqual({
      ...braces,
      _toc: [{ heading: 2, id: "configure-name", text: "Configure {name}" }],
    });
  });

  test("returns the entry untouched when off", async () => {
    expect(
      await addEntryToc({ entry, markdownToc: false, extension: ".md" }),
    ).toBe(entry);
  });
});
