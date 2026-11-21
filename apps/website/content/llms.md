# qino

> A type-safe content pipeline for Markdown, MDX and JSON, a lightweight alternative to a flat-file CMS. Query your content with schema validation, resolved relations and inferred TypeScript types. Nothing to deploy.

- Package: `@qino/cms` on npm, MIT licensed
- Reads Markdown, MDX and JSON files from a content folder at build time or on the server
- Validates frontmatter with any Standard Schema library (Zod, Valibot, ArkType…)
- Generates TypeScript types with the `qino build` CLI
- Requires Node.js 22+ and, optionally, TypeScript 5.9+
- Full documentation in one file: https://www.qino.works/llms-full.txt

## When to use

qino fits when:

- The content is Markdown, MDX or JSON files that live in the app's repository, such as docs, a blog, a changelog or marketing pages, and changes go through commits and pull requests.
- The app is JavaScript or TypeScript on Node.js 22+, such as Next.js or TanStack Start, and the content should be typed and validated without a database or a hosted CMS.
- Coding agents edit the content: plain files they can read and change, which `qino build` checks before the app builds.

Pick something else when:

- The content changes at runtime or comes from users, such as comments or orders.
- The app needs queries a database answers, such as full-text search or joins across thousands of records: qino reads files and exposes getters.
- The content is mostly large media: qino handles media as plain file paths.

## Optional

- [GitHub](https://github.com/CharlyMartin/qino): Source code and issues
- [npm](https://www.npmjs.com/package/@qino/cms): Package page
- [Agent skill](https://www.skills.sh/charlymartin/qino/set-up-qino-cms): Lets a coding agent set up qino in a project
