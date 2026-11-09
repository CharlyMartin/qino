---
name: changeset
description: Changeset or changelog entry for a change to a published package (`packages/*`). Use when a change users would notice touches `packages/*`, or when asked for a changeset or changelog entry.
metadata:
  internal: true
---

# Changeset

## 1. Decide if one is needed

A change needs a changeset when users of a published package would **notice** it: API, behavior, types, CLI output, error messages, dependencies.

Users never notice `apps/website`, `examples/*`, docs content, CI, or repo tooling: they're private and never released. An internal refactor or test-only change to `packages/*` needs none either.

Published packages are `@qino/cms` and `@qino/tooling`. Check `packages/*/package.json` for others before assuming.

## 2. Create the file

Run `pnpm changeset --empty` from the repo root. It creates a randomly named `.md` file in `.changeset/` with empty front matter. Fill it in, with one line per package whose users would notice the change:

```md
---
"@qino/cms": patch
---

<message>
```

**Bumps while pre-1.0:** `patch` for fixes and non-breaking tweaks; `minor` for new features **and** breaking changes; never `major` unless the user explicitly asks for 1.0.

## 3. Write the message

The message is the public changelog entry: it becomes the `CHANGELOG.md` entry and the GitHub release notes. Write it for people using Qino in their project, about what they'll notice.

Start with a present-tense verb that completes "This release…": Adds, Fixes, Removes, Renames, Changes, Improves, Deprecates.

Name the public API a reader would recognize in backticks (`getEntry`, `defineTree`, `qino build`, `titleField`).

```md
// Describes the code
Refactors parseFrontmatter to use the core schema

// Describes what users notice
Fixes `yes`/`no` frontmatter values being parsed as booleans; they now stay strings, per YAML 1.2
```

### Patch

One line is usually enough.

```md
---
"@qino/cms": patch
---

Fixes `qino check` reporting the wrong file path for errors in nested tree nodes
```

### New feature

Name the new API and what it lets users do. Add a short code example when usage isn't obvious:

````md
---
"@qino/cms": minor
---

Adds a `raw` field to Markdown entries holding the untouched source file, frontmatter included. Declare it in the schema to keep it:

```ts
schema: z.object({ title: z.string(), markdown: z.string(), raw: z.string() });
```
````

### Breaking change

Say so plainly ("This is a breaking change") and include migration steps, ideally as a `diff`:

````md
---
"@qino/cms": minor
---

Renames collection and item getters so every primitive reads entries with `getEntry`. This is a breaking change:

```diff
- await posts.getMany();
- await posts.getOne("hello-world");
+ await posts.getEntries();
+ await posts.getEntry("hello-world");
```
````

A change to a default value must mention the old default, the new one, and how to restore the old behavior.

### Longer entries

Use `####` headings or deeper, never `##` or `###`, so the entry nests correctly inside the generated changelog.

## Done when

Every published package whose users would notice the change has a line with its bump, and each message starts with a "This release…" verb and names the public API users will notice.
