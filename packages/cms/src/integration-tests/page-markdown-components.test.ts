import fs from "node:fs/promises";
import os from "node:os";
import nodePath from "node:path";

import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { z } from "zod";

import { initQino } from "../runtime/qino/init-qino";
import type { PageMarkdownComponents } from "../types/page-markdown";
import { afterFrontmatterBlock } from "./after-frontmatter-block";

let tmp: string;

beforeEach(async () => {
  tmp = await fs.mkdtemp(nodePath.join(os.tmpdir(), "qino-agent-md-mdx-"));
  await fs.mkdir(nodePath.join(tmp, "docs"));
});

afterEach(async () => {
  await fs.rm(tmp, { recursive: true, force: true });
});

async function writeDoc(slug: string, body: string) {
  await fs.writeFile(
    nodePath.join(tmp, "docs", `${slug}.mdx`),
    `---\ntitle: Doc\n---\n\n${body}`,
  );
}

function defineDocs(components: PageMarkdownComponents) {
  return initQino({
    contentFolder: tmp,
    mediaFolder: tmp,
    siteUrl: "https://example.com",
  }).defineCollection({
    directory: "docs",
    extension: ".mdx",
    schema: z.object({ title: z.string() }),
    pages: {
      index: "/docs",
      entry: "/docs/{slug}",
      title: "Docs",
      markdownComponents: components,
    },
  });
}

describe("MDX components in page Markdown", () => {
  test("are replaced by what their function returns", async () => {
    await writeDoc(
      "install",
      'Run this:\n\n<InstallBox command="add" />\n\nDone.\n',
    );
    const docs = defineDocs({
      InstallBox: ({ props }) =>
        `\`\`\`sh\nnpm ${props.command} @qino/cms\n\`\`\``,
    });

    expect(afterFrontmatterBlock(await docs.getPageMarkdown("install"))).toBe(
      "# Doc\n\nRun this:\n\n```sh\nnpm add @qino/cms\n```\n\nDone.\n",
    );
  });

  test("receive literal attributes as props, and never run an expression", async () => {
    await writeDoc(
      "props",
      '<Box s="a" n={-2} b={false} bare o={{ k: [1, "x", null] }} t={`y`} e={id} c={1 + 1} f={(() => { globalThis.qinoRan = true })()} {...rest} />\n',
    );
    const docs = defineDocs({ Box: ({ props }) => JSON.stringify(props) });

    expect(afterFrontmatterBlock(await docs.getPageMarkdown("props"))).toBe(
      '# Doc\n\n{"s":"a","n":-2,"b":false,"bare":true,"o":{"k":[1,"x",null]},"t":"y"}\n',
    );
    expect("qinoRan" in globalThis).toBe(false);
  });

  test("receive their children as Markdown, with the components inside already replaced", async () => {
    await writeDoc(
      "nested",
      "<Note>\n  Press <Kbd>Ctrl</Kbd> and **save**.\n\n  Then wait.\n</Note>\n",
    );
    const docs = defineDocs({
      Kbd: ({ children }) => `\`${children}\``,
      Note: ({ children }) =>
        children
          .split("\n")
          .map((line) => (line ? `> ${line}` : ">"))
          .join("\n"),
    });

    expect(afterFrontmatterBlock(await docs.getPageMarkdown("nested"))).toBe(
      "# Doc\n\n> Press `Ctrl` and **save**.\n>\n> Then wait.\n",
    );
  });

  test("stay as written when their function returns null or there is none, with the components inside replaced", async () => {
    await writeDoc(
      "kept",
      '<Tabs label="x">\n  <InstallBox />\n\n  <Hidden a={b} />\n</Tabs>\n',
    );
    const docs = defineDocs({
      InstallBox: () => "```sh\nnpm i @qino/cms\n```",
      Hidden: () => null,
    });

    expect(afterFrontmatterBlock(await docs.getPageMarkdown("kept"))).toBe(
      '# Doc\n\n<Tabs label="x">\n  ```sh\n  npm i @qino/cms\n  ```\n\n  <Hidden a={b} />\n</Tabs>\n',
    );
  });

  test("receive the entry as read, while the heading comes through the view, and may be async", async () => {
    await writeDoc("hello", "<Fields />\n");
    const docs = initQino({
      contentFolder: tmp,
      mediaFolder: tmp,
      siteUrl: "https://example.com",
    }).defineCollection({
      directory: "docs",
      extension: ".mdx",
      schema: z.object({ title: z.string() }),
      pages: {
        index: "/docs",
        entry: "/docs/{slug}",
        title: "Docs",
        markdownComponents: {
          Fields: async ({ entry }) => {
            await new Promise((resolve) => setTimeout(resolve, 1));
            return `${entry._meta.slug}: ${Object.keys(entry).includes("description")}`;
          },
        },
      },
      views: (view) => ({
        default: view({ augment: () => ({ description: "From augment." }) }),
      }),
    });

    expect(afterFrontmatterBlock(await docs.getPageMarkdown("hello"))).toBe(
      "# Doc\n\n> From augment.\n\nhello: false\n",
    );
  });

  test("have the site-relative links they return made absolute", async () => {
    await writeDoc("links", "<Next />\n");
    const docs = defineDocs({ Next: () => "Next: [CLI](/docs/cli)." });

    expect(afterFrontmatterBlock(await docs.getPageMarkdown("links"))).toBe(
      "# Doc\n\nNext: [CLI](https://example.com/docs/cli).\n",
    );
  });

  test("leave links elsewhere absolute when what they return isn't valid MDX", async () => {
    await writeDoc(
      "invalid",
      "<Tabs>\n  [Inside](/inside)\n</Tabs>\n\n<Odd />\n",
    );
    const docs = defineDocs({ Odd: () => "a { b" });

    expect(afterFrontmatterBlock(await docs.getPageMarkdown("invalid"))).toBe(
      "# Doc\n\n<Tabs>\n  [Inside](https://example.com/inside)\n</Tabs>\n\na { b\n",
    );
  });

  test("stay in their list item or blockquote", async () => {
    await writeDoc(
      "blocks",
      "- <Install />\n\n> <Note>\n> First.\n>\n> Second.\n> </Note>\n",
    );
    const docs = defineDocs({
      Install: () => "```sh\nnpm i @qino/cms\n```",
      Note: ({ children }) => `**Note:** ${children}`,
    });

    expect(afterFrontmatterBlock(await docs.getPageMarkdown("blocks"))).toBe(
      "# Doc\n\n- ```sh\n  npm i @qino/cms\n  ```\n\n> **Note:** First.\n>\n> Second.\n",
    );
  });

  test("give their functions LF children, whatever the file uses", async () => {
    await writeDoc("crlf", "<Echo>\r\n  a\r\n\r\n  b\r\n</Echo>\r\n");
    const docs = defineDocs({
      Echo: ({ children }) => JSON.stringify(children),
    });

    expect(afterFrontmatterBlock(await docs.getPageMarkdown("crlf"))).toBe(
      '# Doc\n\n"a\\n\\nb"\n',
    );
  });

  test("replace the heading when what they return opens with an H1", async () => {
    await writeDoc("h1", "<Title />\n\nBody.\n");
    const docs = defineDocs({ Title: () => "# Custom" });

    expect(afterFrontmatterBlock(await docs.getPageMarkdown("h1"))).toBe(
      "# Custom\n\nBody.\n",
    );
  });
});

describe("MDX components on trees and items", () => {
  test("let a tree's LinkGrid list the current node's children", async () => {
    const write = async (slug: string, content: string) => {
      const filePath = nodePath.join(tmp, "guide", `${slug}.mdx`);
      await fs.mkdir(nodePath.dirname(filePath), { recursive: true });
      await fs.writeFile(filePath, content);
    };
    await write("start", "---\nlabel: Start\n---\n\n<LinkGrid />\n");
    await write("start/install", "---\nlabel: Install\n---\n");
    await write("start/cli", "---\nlabel: CLI\n---\n");
    const guide = initQino({
      contentFolder: tmp,
      mediaFolder: tmp,
      siteUrl: "https://example.com",
    }).defineTree({
      directory: "guide",
      extension: ".mdx",
      schema: z.object({ label: z.string() }),
      titleField: "label",
      pages: {
        index: "/guide",
        entry: "/guide/{slug}",
        title: "Guide",
        markdownComponents: {
          LinkGrid: async ({ entry }): Promise<string> => {
            const node = await guide.getTree(entry._meta.slug);
            return node.children
              .map((child) => `- [${child.title}](/guide/${child.slug}.md)`)
              .join("\n");
          },
        },
      },
    });

    expect(afterFrontmatterBlock(await guide.getPageMarkdown("start"))).toBe(
      "# Start\n\n- [CLI](https://example.com/guide/start/cli.md)\n- [Install](https://example.com/guide/start/install.md)\n",
    );
  });

  test("replace an item's components", async () => {
    await fs.writeFile(
      nodePath.join(tmp, "about.mdx"),
      "---\nname: qino\n---\n\nThis is <Name />.\n",
    );
    const about = initQino({
      contentFolder: tmp,
      mediaFolder: tmp,
      siteUrl: "https://example.com",
    }).defineItem({
      file: "about.mdx",
      schema: z.object({ name: z.string() }),
      page: {
        path: "/about",
        markdownComponents: { Name: ({ entry }) => entry.name },
      },
    });

    expect(afterFrontmatterBlock(await about.getPageMarkdown())).toBe(
      "# about\n\nThis is qino.\n",
    );
  });
});
