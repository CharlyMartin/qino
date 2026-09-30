---
name: changeset
description: Use when a change in the Qino monorepo touches a published package (`@qino/cms`) and needs a changeset, or when asked to add, write, or create a changeset or changelog entry.
metadata:
  internal: true
---

# Changeset

Changesets declare which published packages changed, the semver bump, and a user-facing message that becomes the `CHANGELOG.md` entry and GitHub release notes.

## When one is needed

- **Required:** any change to `packages/*` that users of the package would notice (API, behavior, types, CLI output, error messages, dependencies).
- **Not needed:** `apps/website`, `examples/*`, docs content, CI, or repo tooling. They're private and never released. An internal refactor or test-only change to `packages/*` doesn't need one either.

The only published package is `@qino/cms`. Check `packages/*/package.json` for others before assuming.

## Creating the file

Run `pnpm changeset --empty` from the repo root. It creates a randomly named `.md` file in `.changeset/` with empty front matter. Edit that file to add the bump and message.

## Format

```md
---
"@qino/cms": patch
---

<message>
```

- The package name must match `name` in its `package.json`. Use double quotes.
- **Bumps while pre-1.0:** `patch` for fixes and non-breaking tweaks; `minor` for new features **and** breaking changes; never `major` unless the user explicitly asks for 1.0.

## Writing the message

The message is a public changelog entry. Write it for people using Qino in their project, not for code reviewers.

Start with a present-tense verb that completes "This release…": Adds, Fixes, Removes, Renames, Changes, Improves, Deprecates.

Name the API a reader would recognize in backticks (`getEntry`, `defineTree`, `qino build`, `titleField`). Leave out internal helpers, file names, and tests.

```md
// Too implementation-focused
Refactors parseFrontmatter to use the core schema

// Better: user-facing impact
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

### New feature (minor)

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

### Breaking change (minor while pre-1.0)

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
