# AGENTS.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

qino is a flat-file Markdown CMS. Its documentation, the reference for its public API, is in `apps/website/content/docs/`.

## Monorepo layout

- pnpm workspaces (`pnpm-workspace.yaml`) + Turborepo (`turbo.json`)
- `packages/*` — published libraries (`@qino/cms`, `@qino/tooling`)
- `apps/website` — the qino website and docs
- `examples/*` — demo apps that exercise qino
- Node `>=22`, package manager pinned via `packageManager` in `package.json`

Each package needs its own `package.json` with `build`, `lint`, `check-types`, and (where relevant) `dev` and `test` scripts so Turbo can pick them up.

## Commands

Scripts live in the root `package.json`. `pnpm --filter <pkg-name> <script>` runs one package's script alone (e.g. `pnpm --filter @qino/cms test`). To build an app or example, run `pnpm turbo run build --filter=<pkg-name>`: it builds the workspace packages first, and the `qino` CLI runs from `@qino/cms`'s `dist/`.

## Conventions specific to this repo

- `.env*` files are declared as build inputs in `turbo.json`; don't rely on env vars outside that pattern without updating it.
- Pin exact versions when adding a dependency, without `^` or `~`.

## Coding principles

1. Stick to one function per file, and name the file after it: `create-collection.ts` exports a single `createCollection` function. Give a function its own test file, `create-collection.test.ts`, when it has branches its callers' tests don't reach. When agreeing test seams, name those functions.
2. Avoid return types unless necessary. Let TypeScript infer them where possible, to keep code DRY and maintainable.
3. Only use `===` when necessary, when types don't match and you want to avoid coercion, for instance. When types match, use `==`.
4. Don't inline types. Declare them as named types outside the function (e.g. `type CheckOptions = { … }`) and reference them in the signature or body, for readability.

## Definition of done

A code change is done once it's in an open pull request. How it gets built depends on the change:

- **Feature:** create the feature branch first (`ship` step 1), because `/implement` commits to the current branch. The user types each slash command; when one finishes, name the next: `/grill-with-docs` → `/to-spec` → `/to-tickets` → `/implement` → `/retro`. Apply the retro improvements the user picks, then continue below.
- **Bug fix:** fix it test-first with `tdd`; use `diagnosing-bugs` when the cause isn't obvious.
- **Docs-only or trivial changes, and changes the user wants to try out without committing:** stop once the checks are green.

Then go through these steps in order, without asking the user between them:

1. Get the checks green: `pnpm test`, `pnpm check-types` and `pnpm biome check .`.
2. Run the `codex-review` skill until the review is clean. If it ends not clean, stop and report to the user.
3. Run the `ship` skill.

## Agent skills

### Issue tracker

GitHub Issues on `CharlyMartin/qino`, via `gh`. See `docs/agents/issue-tracker.md`.

### Triage labels

Default five: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: root `GLOSSARY.md` + `docs/adr/`. See `docs/agents/domain.md`.

<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": false` in the root `turbo.json` or `turbo.jsonc` to opt out; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.
<!-- END:turborepo-agent-rules -->
