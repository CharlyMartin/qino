import fs from "node:fs/promises";
import os from "node:os";
import nodePath from "node:path";

import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { z } from "zod";

import { initQino } from "../runtime/qino/init-qino";
import type { AgentMarkdownComponent } from "../types/agent-markdown";

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

function defineDocs(components: Record<string, AgentMarkdownComponent>) {
  return initQino({
    contentFolder: tmp,
    mediaFolder: tmp,
    siteUrl: "https://example.com",
  }).defineCollection({
    directory: "docs",
    extension: ".mdx",
    schema: z.object({ title: z.string() }),
    pages: { index: "/docs", entry: "/docs/{slug}", title: "Docs" },
    agentMarkdown: { components },
  });
}

describe("MDX components in agent Markdown", () => {
  test("are replaced by what their function returns", async () => {
    await writeDoc(
      "install",
      'Run this:\n\n<InstallBox command="add" />\n\nDone.\n',
    );
    const docs = defineDocs({
      InstallBox: ({ props }) =>
        `\`\`\`sh\nnpm ${props.command} @qino/cms\n\`\`\``,
    });

    expect(await docs.getAgentMarkdown("install")).toBe(
      "# Doc\n\nRun this:\n\n```sh\nnpm add @qino/cms\n```\n\nDone.\n",
    );
  });

  test("receive literal attributes as props, and never run an expression", async () => {
    await writeDoc(
      "props",
      '<Box s="a" n={-2} b={false} bare o={{ k: [1, "x", null] }} t={`y`} e={id} c={1 + 1} f={(() => { globalThis.qinoRan = true })()} {...rest} />\n',
    );
    const docs = defineDocs({ Box: ({ props }) => JSON.stringify(props) });

    expect(await docs.getAgentMarkdown("props")).toBe(
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

    expect(await docs.getAgentMarkdown("nested")).toBe(
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

    expect(await docs.getAgentMarkdown("kept")).toBe(
      '# Doc\n\n<Tabs label="x">\n  ```sh\n  npm i @qino/cms\n  ```\n\n  <Hidden a={b} />\n</Tabs>\n',
    );
  });

  test("receive the entry as read, and may be async", async () => {
    await writeDoc("hello", "<Slug />\n");
    const docs = defineDocs({
      Slug: async ({ entry }) => {
        await new Promise((resolve) => setTimeout(resolve, 1));
        return `Slug: ${(entry as { _meta: { slug: string } })._meta.slug}`;
      },
    });

    expect(await docs.getAgentMarkdown("hello")).toBe("# Doc\n\nSlug: hello\n");
  });

  test("have the site-relative links they return made absolute", async () => {
    await writeDoc("links", "<Next />\n");
    const docs = defineDocs({ Next: () => "Next: [CLI](/docs/cli)." });

    expect(await docs.getAgentMarkdown("links")).toBe(
      "# Doc\n\nNext: [CLI](https://example.com/docs/cli).\n",
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
      pages: { index: "/guide", entry: "/guide/{slug}", title: "Guide" },
      agentMarkdown: {
        components: {
          LinkGrid: async ({ entry }): Promise<string> => {
            const node = await guide.getTree(entry._meta.slug);
            return node.children
              .map((child) => `- [${child.title}](/guide/${child.slug}.md)`)
              .join("\n");
          },
        },
      },
    });

    expect(await guide.getAgentMarkdown("start")).toBe(
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
      page: "/about",
      agentMarkdown: { components: { Name: ({ entry }) => entry.name } },
    });

    expect(await about.getAgentMarkdown()).toBe("# about\n\nThis is qino.\n");
  });
});
