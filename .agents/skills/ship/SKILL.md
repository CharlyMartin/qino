---
name: ship
description: Ship finished, reviewed work as a pull request. Use when a change is ready for a PR, or when asked to ship or open a PR.
metadata:
  internal: true
---

# Ship

Ship when the checks from AGENTS.md are green and the Codex review is clean. If the change touches a published package in a way users notice, add a changeset first with the `changeset` skill.

## 1. Branch

Work on a feature branch. If you're on `main`, create one named after the main change, in kebab case:

```sh
git switch -c <type>/<short-slug>   # e.g. feat/tree-get-entries-ancestors
```

## 2. Commit

Make atomic commits. A typical split:

1. The core change in `packages/*`, with its tests and changeset
2. Docs in `apps/website`
3. Usage in `examples/*`

A small change is one commit. Stage by path (`git add <paths>`). You're done when `git status` shows nothing from the task.

Subjects are Conventional Commits with a scope, like the history:

```
feat(cms): add getEntries and getAncestors to trees
fix(cms): return the anchor node for a nested folder's first child
docs(website): document getEntries
feat(examples): breadcrumbs on doc pages
```

Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`. Scopes: `cms`, `tooling`, `website`, `examples`. Breaking changes take `!`, as in `feat(cms)!: …`. Imperative, lowercase, no trailing period. Add a body only when the why isn't obvious from the subject.

Commit messages and PRs carry no `Co-Authored-By` trailers or "Generated with Claude Code" lines.

## 3. Push

```sh
git push -u origin <branch>
```

Push without `--force`. If the push is rejected, stop and tell the user.

## 4. Open the PR

```sh
gh pr create --base main --title "<title>" --body-file - <<'EOF'
<body>
EOF
```

The quoted heredoc keeps backticks in the body from running as shell commands.

**Title:** a Conventional Commit subject for the whole PR. PRs are squash-merged, so it becomes the commit on `main`.

**Body:** for a reviewer, about the change itself. Lead with what the PR adds or fixes and why, naming the public APIs in backticks, then list the other changes:

```md
Adds two tree getters:

- `getEntries(options?)`: every entry in reading order, with the selected view. Replaces `getFlatTree()` + `getEntry()` per node for sitemaps, search indexes, feeds.
- `getAncestorNodes(slug)`: nodes above a slug, root down, for breadcrumbs.

Also:

- Docs: new `getEntries` and `getAncestorNodes` pages.
- `examples/next-js`: breadcrumbs on doc pages.
- Changeset: `@qino/cms` minor.
```

When the Codex review changed something worth knowing, or rejected a finding a reviewer might raise again, add a one-line "Review" note.

## 5. Report

The PR URL, the list of commits, and the branch name.
