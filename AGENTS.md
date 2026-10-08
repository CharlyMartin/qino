# AGENTS.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Qino is a flat-file Markdown CMS. See local-only `SPECS.md` and `specs/**.md` (gitignored) for the design intent (config/collection/page APIs, `qino-lock.json`, CLI commands `qino build` / `qino watch`, generated `.d.ts` types). The repo is in early scaffolding — `examples/` and `packages/` are empty workspaces awaiting the first packages.

## Monorepo layout

- pnpm workspaces (`pnpm-workspace.yaml`) + Turborepo (`turbo.json`)
- `examples/*` — consumer apps (e.g. example/demo Next.js sites that exercise Qino)
- `packages/*` — publishable libraries (the `qino` core, CLI, schema helpers, etc.)
- Node `>=22`, package manager pinned via `packageManager` in `package.json`

When adding a new package, place library code in `packages/<name>` and demo/host apps in `examples/<name>`. Each package needs its own `package.json` with `build`, `lint`, `check-types`, and (where relevant) `dev` scripts so Turbo can pick them up.

## Commands

Run from the repo root:

- `pnpm build` — `turbo run build` across the workspace
- `pnpm dev` — `turbo run dev` (persistent, no cache)
- `pnpm lint` — `turbo run lint`
- `pnpm check-types` — `turbo run check-types`
- `pnpm format` — Prettier on `**/*.{ts,tsx,md}`

To run a script in a single workspace package: `pnpm --filter <pkg-name> <script>` (e.g. `pnpm --filter @qino/cms build`).

No test runner is configured yet — pick one when introducing the first package and wire a `test` task into `turbo.json`.

## Conventions specific to this repo

- Turbo `build` task expects outputs in `.next/**` (excluding cache) or none — adjust `turbo.json` `outputs` if a package emits to `dist/` instead.
- `.env*` files are declared as build inputs in `turbo.json`; don't rely on env vars outside that pattern without updating it.
- When installing packages via `npm`, also use the exact version, so ~ or carret.

## Coding principles

1. Stick to one function per file, and name if after it: `create-collection.ts` should export a single `createCollection` function. Important functions shoudld also have a test file with the same name: `create-collection.test.ts`.
2. Avoid return types unless necessary. Let TypeScript infer them where possible, to keep code DRY and maintainable.
3. Only use `===` when necessary, when types don't match and you want to avoid coercion, for instance. When types match, use `==`.

<!-- BEGIN:turborepo-agent-rules -->

# This is NOT the Turborepo you know

Turborepo configuration, task behavior, and CLI commands can vary between installed versions and may differ from your training data. Resolve the `turbo` package from this file's directory or relevant workspace; in monorepos, it may not be visible from the repository root. For example, run `node -p "require.resolve('turbo/package.json')"` from a workspace that depends on `turbo`.

Read `docs/README.md` inside that installed package first, then read the relevant pages from its `docs/` directory before changing Turborepo configuration or commands. Heed deprecation notices. These bundled docs match the installed package version and are available without network access.

This block is written and re-added by `turbo` before repository-scoped commands when an AI agent is detected. In the Turborepo source repository, its template is defined in `crates/turborepo-cli/src/cli/agent_guidance.rs`. Removing the managed block while updates are enabled means a later qualifying invocation will add it again. Set `"agentGuidance": false` in the root `turbo.json` or `turbo.jsonc` to opt out; this does not remove an existing block. Keep the block committed with your work to avoid an uncommitted change on the next agent invocation.
<!-- END:turborepo-agent-rules -->
