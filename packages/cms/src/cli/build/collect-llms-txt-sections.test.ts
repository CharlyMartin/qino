import { describe, expect, test } from "vitest";

import { QinoPrimitiveMarker } from "../../data/globals";
import type { ListingSection } from "../../types/agent-markdown";
import { collectLlmsTxtSections } from "./collect-llms-txt-sections";

function section(title: string) {
  return {
    title,
    links: [{ title, url: `https://example.com/${title}.md`, description: "" }],
  };
}

function primitive(directory: string, sections?: Array<ListingSection>) {
  return {
    [QinoPrimitiveMarker]: {
      directory,
      pages: sections && { getListingSections: async () => sections },
    },
  } as never;
}

function item(file: string, title?: string) {
  return {
    [QinoPrimitiveMarker]: {
      file,
      page: title && { getListingLink: async () => section(title).links[0] },
    },
  } as never;
}

describe("collectLlmsTxtSections", () => {
  test("lists trees, then collections, then items, each by path", async () => {
    const sections = await collectLlmsTxtSections({
      trees: [
        primitive("guides", [section("Guide")]),
        primitive("docs", [section("API"), section("Concepts")]),
      ],
      collections: [
        primitive("posts", [section("Blog")]),
        primitive("authors", [section("Authors")]),
        primitive("snippets"),
      ],
      items: [
        item("team.md", "Team"),
        item("about.md", "About"),
        item("footer.md"),
      ],
    });

    expect(sections.map(({ title }) => title)).toEqual([
      "API",
      "Concepts",
      "Guide",
      "Authors",
      "Blog",
      "Pages",
    ]);
    expect(sections.at(-1)?.links.map(({ title }) => title)).toEqual([
      "About",
      "Team",
    ]);
  });

  test("leaves out ## Pages when no item has a page", async () => {
    expect(
      await collectLlmsTxtSections({
        trees: [],
        collections: [],
        items: [item("footer.md")],
      }),
    ).toEqual([]);
  });
});
