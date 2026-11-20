---
"@qino/cms": minor
---

Adds `agentMarkdown.components` to collections, trees and items, to turn MDX components into Markdown in agent Markdown. Each function receives the component's literal `props`, its `children` already converted to Markdown, and the `entry` as read. It returns Markdown, or `null` to keep the component as written:

```ts
const docs = qino.defineTree({
  directory: "docs",
  extension: ".mdx",
  titleField: "title",
  schema,
  pages: { index: "/docs", entry: "/docs/{slug}", title: "Docs" },
  agentMarkdown: {
    components: {
      InstallBox: ({ props }) => `\`\`\`sh\nnpm ${props.command ?? "install"} @qino/cms\n\`\`\``,
      // Annotated, because it reads `docs`, whose type it's part of.
      LinkGrid: async ({ entry }): Promise<string> => {
        const node = await docs.getTree(entry._meta.slug);
        return node.children.map((child) => `- [${child.title}](/docs/${child.slug}.md)`).join("\n");
      },
    },
  },
});
```

`props` holds strings, numbers, booleans, `null`, and arrays and objects of them. Attributes set by any other expression are left out, and qino never runs one. A component missing from the map stays as written, and components inside it are still replaced. Replacements are spliced in by position and stay inside their component's list item or blockquote. Their site-relative links are made absolute, as `children`'s already are.
