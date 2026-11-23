# AGENTS.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

qino is a flat-file Markdown CMS. For how a public API behaves, read its docs in `apps/website/content/docs/`.

## Monorepo layout

- pnpm workspaces (`pnpm-workspace.yaml`) + Turborepo (`turbo.json`)
- `packages/*` — published libraries (`@qino/cms`, `@qino/tooling`)
- `apps/website` — the qino website and docs
- `examples/*` — demo apps that exercise qino
- Node `>=22`, package manager pinned via `packageManager` in `package.json`

Each package needs its own `package.json` with `build`, `lint`, `check-types`, and (where relevant) `dev` and `test` scripts so Turbo can pick them up.

## Commands

Scripts live in the root `package.json`. `pnpm --filter <pkg-name> <script>` runs one package's script alone (e.g. `pnpm --filter @qino/cms test`). To build an app or example, run `pnpm turbo run build --filter=<pkg-name>`: its `prebuild` runs `qino build` from `@qino/cms`'s `dist/`, and Turbo builds the workspace packages first.

## Conventions specific to this repo

- `.env*` files are declared as build inputs in `turbo.json`; don't rely on env vars outside that pattern without updating it.
- Pin exact versions when adding a dependency, without `^` or `~`. Then check that `git diff pnpm-lock.yaml` changes no other package's version, and run `pnpm check-types`: `pnpm add` can report success while linking a store path that doesn't exist.
- Before changing `turbo.json` or Turbo commands, read `docs/README.md` in the installed `turbo` package (`node -p "require.resolve('turbo/package.json')"`): its bundled docs match the installed version.
- A build that writes gitignored files that are served or read later, such as `qino build`'s `llms.txt` files, lists them in its Turbo task's `outputs`: a cache hit restores only those.

## Coding principles

1. Stick to one function per file, and name the file after it: `create-collection.ts` exports a single `createCollection` function. Give a function its own test file, `create-collection.test.ts`, when it has branches its callers' tests don't reach. A spec's Testing Decisions list those functions.
2. Avoid return types unless necessary. Let TypeScript infer them where possible, to keep code DRY and maintainable.
3. Only use `===` when necessary, when types don't match and you want to avoid coercion, for instance. When types match, use `==`.
4. Don't inline types. Declare them as named types outside the function (e.g. `type CheckOptions = { … }`) and reference them in the signature or body, for readability.

## Definition of done

A code change is done once it's in an open pull request. How it gets built depends on the change:

- **Feature:** create the feature branch first (`ship` step 1), because `/implement` commits to the current branch. The user types each slash command; when one finishes, name the next: `/grill-with-docs` → `/to-spec` → `/to-tickets` → `/implement` → `/retro`. Apply the retro improvements the user picks, then continue below.
  - Before the first grilling round, search open issues for the feature (`gh issue list --search "<terms>"`), and grill from one that covers it.
  - Before `/implement`, read the parent ticket's "Decisions while implementing" comment. Before `code-review`, add each decision you take that the spec doesn't cover under the ticket's heading, posting the comment if there isn't one. Add the review's fixes there afterwards. A ticket without a parent records its decisions in its PR description. When the user changes a spec decision, edit the spec and the ticket to match. A note you leave for a later ticket names the function or file to start from, and leaves the design to that ticket.
  - Ask the user before building a decision that changes the public surface, such as an option's default or an output format, or that changes what an earlier ticket shipped.
  - Run `/implement`'s `code-review` the way `ship`'s Review step describes.
  - When a ticket's acceptance criteria run on a preview deploy, push its branch during `/implement` and run `ship` step 6's preview checks.
- **Bug fix:** fix it test-first with `tdd`; use `diagnosing-bugs` when the cause isn't obvious.
- **Docs-only or trivial changes, and changes the user wants to try out without committing:** stop once the checks are green.

Then go through these steps in order, without asking the user between them:

1. Get `pnpm check` green: it runs every check CI runs.
2. Run the `ship` skill. It commits, then reviews what `/implement` didn't, before opening the PR.

## Agent skills

### Issue tracker

GitHub Issues on `CharlyMartin/qino`, via `gh`. See `docs/agents/issue-tracker.md`.

### Triage labels

Default five: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: root `GLOSSARY.md` + `docs/adr/`. See `docs/agents/domain.md`.
