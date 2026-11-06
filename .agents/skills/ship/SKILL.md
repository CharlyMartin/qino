---
name: ship
description: Use in the Qino monorepo once a change is finished and its Codex review is clean, to commit the work in small logical commits, push the branch and open a pull request with a description. Also use when asked to commit, push, open a PR, or ship a change.
metadata:
  internal: true
---

# Ship

Turns finished work into a pull request: a branch, a few focused commits, a push, and a PR with a description.

## Preconditions

- `pnpm test`, `pnpm check-types` and `pnpm biome check .` pass.
- The `codex-review` loop ended clean. If it stopped at its round limit with open findings, don't ship: tell the user.
- If the change touches a published package (`packages/*`) in a way users notice, a changeset exists. Use the `changeset` skill to add one first.

## Branch

Never commit to `main`. If you're on `main`, create a branch first:

```sh
git switch -c <type>/<short-slug>
```

Use the type of the main change and a few words in kebab case, for example `feat/tree-get-entries-ancestors` or `fix/nested-folder-anchor`.

## Commits

Split the work into small logical commits, each one a coherent step that would make sense to review on its own. For example:

1. The core change in `packages/*`, with its tests and changeset
2. Docs in `apps/website`
3. Usage in `examples/*`

Don't split a function from its test, and don't make a commit that breaks the build. If the whole change is small, one commit is fine.

Stage files by path (`git add <paths>`), never `git add -A` or `git add .`, so stray files don't slip in. Check `git status` after the last commit: nothing from the task should be left over.

Commit messages follow Conventional Commits with a scope, matching the history:

```
feat(cms): add getEntries and getAncestors to trees
fix(cms): return the anchor node for a nested folder's first child
docs(website): document getEntries
feat(examples): breadcrumbs on doc pages
```

Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`. Scopes: `cms`, `tooling`, `website`, `examples`. Mark breaking changes with `!`, as in `feat(cms)!: …`. Use the imperative mood, lowercase, no trailing period. Add a body only when the why isn't obvious from the subject.

Don't add `Co-Authored-By` trailers or "Generated with Claude Code" lines to commits or PRs.

## Push

```sh
git push -u origin <branch>
```

Never force push, and never push to `main`.

## Pull request

```sh
gh pr create --base main --title "<title>" --body-file <file>
```

Write the body to a file in the scratchpad first, so Markdown and backticks survive the shell.

**Title:** a Conventional Commit subject for the whole PR, like `feat(cms): add getEntries and getAncestors to trees`. PRs are squash-merged, so the title becomes the commit on `main`.

**Body:** written for a reviewer. Lead with what the PR adds or fixes and why, naming the public APIs in backticks. Then a bullet list of the other changes. Example:

```md
Adds two tree getters:

- `getEntries(options?)`: every entry in reading order, with the selected view. Replaces `getFlatTree()` + `getEntry()` per node for sitemaps, search indexes, feeds.
- `getAncestorNodes(slug)`: nodes above a slug, root down, for breadcrumbs.

Also:

- Docs: new `getEntries` and `getAncestorNodes` pages.
- `examples/next-js`: breadcrumbs on doc pages.
- Changeset: `@qino/cms` minor.
```

Add a short "Review" line when the Codex review led to fixes worth knowing about, or rejected findings a reviewer might raise again. Leave out test runs and process details.

## Report

Give the user the PR URL, the list of commits, and the branch name.
