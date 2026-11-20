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
      getListingSections: sections && (async () => sections),
    },
  } as never;
}

function item(file: string, title?: string) {
  return {
    [QinoPrimitiveMarker]: {
      file,
      getListingLink: title && (async () => section(title).links[0]),
    },
  } as never;
}

describe("collectLlmsTxtSections", () => {
  test("lists trees, then collections, then items, each by path, once each", async () => {
    const posts = primitive("posts", [section("Blog")]);

    const sections = await collectLlmsTxtSections({
      trees: [
        primitive("guides", [section("Guide")]),
        primitive("docs", [section("API"), section("Concepts")]),
      ],
      collections: [
        posts,
        primitive("authors", [section("Authors")]),
        posts,
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
