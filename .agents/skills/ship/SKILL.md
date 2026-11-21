---
name: ship
description: Ship finished, reviewed work as a pull request. Use when a change is ready for a PR, or when asked to ship or open a PR.
metadata:
  internal: true
---

# Ship

Ship when the checks from AGENTS.md are green. If the change touches a published package in a way users notice, add a changeset first with the `changeset` skill.

## 1. Branch

Work on a feature branch. If you're on `main`, create one named after the main change, in kebab case:

```sh
git switch -c <type>/<short-slug>   # e.g. feat/tree-get-entries-ancestors
```

In a **ticket stack** (one PR per ticket of a spec), each ticket gets its own branch, created from the previous ticket's branch, or from `main` once that branch's PR has merged.

PRs are squash-merged, so a merge leaves the next branch carrying the previous ticket's original commits. Once the previous PR merges, move the next branch onto `main`:

```sh
git fetch origin main
git rebase --onto origin/main <previous ticket's branch> <branch>
```

When you ship a PR off `main` while a ticket stack is open, test it against the stack before telling the user how the two interact: merge it into the stack's last branch on a throwaway branch and run `pnpm check`, since a merge without conflicts can still break a rebased branch. Tell the user what the rebase will need, then delete the throwaway branch.

When the stack needs that PR before its own PRs merge, merge `main` down the stack instead: `.claude/skills/ship/merge-down-stack.sh main <first branch> … <last branch>`. It merges each branch into the next, runs each branch's own CI checks, and stops at each conflict or failing check, so you can fix it, commit and run it again. Then push each branch (step 4).

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

## 3. Review

`code-review` reads committed work, so review after committing, against the base (step 5). Give its spec reviewer the scratchpad directory's path, and have it probe edge cases by running the code and name the probes it ran. A probe that has to sit in the repo to run is named `zz-probe-*`, which git ignores, and deleted afterwards. When the change reads or rewrites Markdown or MDX bodies, such as agent Markdown, the table of contents or stats, have the spec reviewer also run the probes in `docs/agents/markdown-probes.md`. When the change alters how the website answers Markdown or HTML requests, have the spec reviewer also run `apps/website/scripts/probe-agent-markdown.sh --dev` against a dev server from `apps/website/scripts/dev-server.sh start`, and add a probe there for each case the change adds. Give the spec reviewer the decisions the user took for this change, and have it name the spec and ticket lines they contradict.

Review whatever `/implement`'s review didn't cover: the whole change for a bug fix, or the commits made after it other than the fixes for its findings, such as retro improvements. Skip this step when nothing is left.

Fix each finding or skip it with a reason, get the checks green again, and commit the fixes. If a finding you can't resolve is still open, stop and report it to the user.

## 4. Push

Before pushing to a branch whose PR is already open, check that it still is: `gh pr view <number> --json state`. Commits pushed after a merge never reach `main`, so put them on a new branch, such as the next ticket's.

```sh
git push -u origin <branch>
```

Push without `--force`. The one exception is a ticket-stack branch you just moved onto `main` (step 1): push it with `--force-with-lease`. If a push is rejected, stop and tell the user.

## 5. Open the PR

```sh
gh pr create --base <base> --title "<title>" --body-file - <<'EOF'
<body>
EOF
```

The quoted heredoc keeps backticks in the body from running as shell commands.

**Base:** `main`. In a ticket stack, it's the previous ticket's branch while that branch's PR is unmerged. Once it merges, move the branch onto `main` (step 1) and retarget an open PR with `gh pr edit <number> --base main`.

**Title:** a Conventional Commit subject for the whole PR. PRs are squash-merged, so it becomes the commit on `main`.

**Body:** write it with the `pr` skill, naming the public APIs in backticks. Below the template, add:

- `Closes #<n>` for each spec and ticket issue the PR resolves.
- A one-line "Review" note when a review changed something worth knowing, or a finding was skipped that a reviewer might raise again.

## 6. Report

When the PR changes how the website answers Markdown or HTML requests, probe its Vercel preview first, since only the preview runs the deployed function and serves the prerendered files:

1. Run `apps/website/scripts/preview-url.sh`, which waits for the pushed commit's deploy and prints the preview's URL.
2. Run `apps/website/scripts/probe-agent-markdown.sh <url>`. When the ticket names scanner checks, also run `node apps/website/scripts/scan-agent-readiness.mjs <url> [path...]`.
3. Fix the failures the change causes. Each one left belongs to an open issue; name it.

Then report the PR URL, the list of commits, the branch name, and the preview's probe and scanner results.
