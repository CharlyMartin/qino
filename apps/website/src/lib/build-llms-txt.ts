import type { DocsLink } from "../types/docs-link";
import { externalLinks } from "./external-links";
import { site } from "./site";

type LlmsTxtSection = DocsLink & {
  pages: Array<DocsLink>;
};

type LlmsTxtPost = {
  slug: string;
  title: string;
  description: string;
};

type LlmsTxtOptions = {
  sections: Array<LlmsTxtSection>;
  posts: Array<LlmsTxtPost>;
};

// Follows https://llmstxt.org: H1, summary blockquote, then H2 link lists.
export function buildLlmsTxt({ sections, posts }: LlmsTxtOptions) {
  const toDocsItem = (link: DocsLink) =>
    `- [${link.title}](${site.url}/docs/${link.slug}.md): ${link.description}`;

  const docs = sections.map((section) =>
    [
      `## ${section.title}`,
      "",
      toDocsItem(section),
      ...section.pages.map(toDocsItem),
    ].join("\n"),
  );

  const blog = [
    "## Blog",
    "",
    ...posts.map(
      (post) =>
        `- [${post.title}](${site.url}/blog/${post.slug}): ${post.description}`,
    ),
  ].join("\n");

  const blocks = [
    `# ${site.name}`,
    `> ${site.description}`,
    [
      "- Package: `@qino/cms` on npm, MIT licensed",
      "- Reads Markdown, MDX and JSON files from a content folder at build time or on the server",
      "- Validates frontmatter with any Standard Schema library (Zod, Valibot, ArkType…)",
      "- Generates TypeScript types with the `qino build` CLI",
      "- Requires Node.js 22+ and, optionally, TypeScript 5.9+",
      `- Full documentation in one file: ${site.url}/llms-full.txt`,
    ].join("\n"),
    ...docs,
    blog,
    [
      "## Optional",
      "",
      `- [GitHub](${externalLinks.github}): Source code and issues`,
      `- [npm](${externalLinks.npm}): Package page`,
      `- [Agent skill](${externalLinks.skill}): Lets a coding agent set up qino in a project`,
    ].join("\n"),
  ];

  return `${blocks.join("\n\n")}\n`;
}
