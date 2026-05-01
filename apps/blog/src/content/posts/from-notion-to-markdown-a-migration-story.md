---
title: "From Notion to Markdown: A Migration Story"
created-on: "2025-08-04T09:00:00Z"
updated-on: "2025-08-12T14:00:00Z"
image: "https://picsum.photos/seed/from-notion-to-markdown-a-migration-story/1200/630"
---

We had three years of content in Notion. Migrating it took two weeks and one very long Sunday.

The process, in order:

1. Export the workspace as Markdown + ZIP.
2. Run a script to fix Notion's quirks: nested-toggle conversion, broken relative links, image filenames with spaces.
3. Normalize frontmatter into the new schema.
4. Spot-check the 50 most-trafficked pages.
5. Set up redirects for the URL changes.

The script that did 80% of the work was about 200 lines:

```ts
for (const file of glob("export/**/*.md")) {
  const raw = await readFile(file, "utf8");
  const cleaned = raw
    .replace(/!\[\]\((.*?)\)/g, normalizeImage)
    .replace(/^# (.+)$/m, "");
  const frontmatter = inferFromFilename(file);
  await writeFile(targetPath(file), serialize(frontmatter, cleaned));
}
```

The lesson: migrating *out* of a CMS is mostly about parsing whatever weird thing the export gave you.
