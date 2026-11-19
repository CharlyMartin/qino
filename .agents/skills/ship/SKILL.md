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

A small change is one commit. Commits already on the branch, such as those from `/implement`, stay as they are; commit what's left. Stage by path (`git add <paths>`). You're done when `git status` shows nothing from the task.

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

**Body:** write it with the `pr` skill, naming the public APIs in backticks. Below the template, add:

- `Closes #<n>` for each spec and ticket issue the PR resolves.
- A one-line "Review" note when the Codex review changed something worth knowing, or rejected a finding a reviewer might raise again.

## 5. Greptile findings

Greptile reviews a PR once, a few minutes after it opens, and only when it changes a file in `packages/` (`.greptile/config.json` turns automatic reviews off, `packages/.greptile/config.json` turns them back on). It doesn't review a later push: the user asks for another review by commenting `@greptileai`, so never post that comment yourself. Read its comments, if there are any:

```sh
gh api repos/{owner}/{repo}/pulls/<number>/comments
```

Triage each finding the way the `codex-review` skill does: apply the valid ones, skip the false positives and out-of-scope suggestions with a reason. Get the checks green again, then commit and push the fixes to the same branch.

Reply on each thread once the fixes are pushed: what was applied and in which commit, or why the finding was skipped.

```sh
gh api repos/{owner}/{repo}/pulls/<number>/comments/<comment-id>/replies -f body="<reply>"
```

A PR with no Greptile comments needs nothing here.

## 6. Report

The PR URL, the list of commits, and the branch name. If Greptile left findings, add what was applied and what was skipped.
