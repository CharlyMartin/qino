import { describe, expect, test } from "vitest";

import { QinoPrimitiveMarker } from "../../data/globals";
import { collectLlmsFullDocuments } from "./collect-llms-full-documents";

type PrimitiveOptions = {
  documents?: Array<string>;
  llmsFull?: boolean;
};

function primitive(
  directory: string,
  { documents, llmsFull }: PrimitiveOptions,
) {
  return {
    [QinoPrimitiveMarker]: {
      directory,
      pages: documents && {
        llmsFull,
        getEntryPagesAgentMarkdown: async () => documents,
      },
    },
  } as never;
}

function item(file: string, document?: string) {
  return {
    [QinoPrimitiveMarker]: {
      file,
      page: document && { getPageAgentMarkdown: async () => document },
    },
  } as never;
}

describe("collectLlmsFullDocuments", () => {
  test("follows llms.txt's order: trees, then collections, then items, each by path", async () => {
    const documents = await collectLlmsFullDocuments({
      trees: [
        primitive("guides", { documents: ["# Guide"] }),
        primitive("docs", { documents: ["# API", "# CLI"] }),
      ],
      collections: [
        primitive("posts", { documents: ["# Hello"] }),
        primitive("authors", { documents: ["# Jane"] }),
        primitive("snippets", {}),
      ],
      items: [
        item("team.md", "# Team"),
        item("about.md", "# About"),
        item("footer.md"),
      ],
    });

    expect(documents).toEqual([
      "# API",
      "# CLI",
      "# Guide",
      "# Jane",
      "# Hello",
      "# About",
      "# Team",
    ]);
  });

  test("leaves out a primitive with llmsFull: false, without reading it", async () => {
    const unread = {
      [QinoPrimitiveMarker]: {
        directory: "logs",
        pages: {
          llmsFull: false,
          getEntryPagesAgentMarkdown: () => {
            throw new Error("read");
          },
        },
      },
    } as never;

    expect(
      await collectLlmsFullDocuments({
        trees: [primitive("docs", { documents: ["# API"], llmsFull: true })],
        collections: [unread],
        items: [],
      }),
    ).toEqual(["# API"]);
  });
});
