# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

Qino is a flat-file Markdown CMS. See `SPECS.md` for the design intent (config/collection/page APIs, `qino-lock.json`, CLI commands `qino build` / `qino watch`, generated `.d.ts` types). The repo is in early scaffolding — `apps/` and `packages/` are empty workspaces awaiting the first packages.

## Monorepo layout

- pnpm workspaces (`pnpm-workspace.yaml`) + Turborepo (`turbo.json`)
- `apps/*` — consumer apps (e.g. example/demo Next.js sites that exercise Qino)
- `packages/*` — publishable libraries (the `qino` core, CLI, schema helpers, etc.)
- Node `>=18`, package manager pinned to `pnpm@9.0.0`

When adding a new package, place library code in `packages/<name>` and demo/host apps in `apps/<name>`. Each package needs its own `package.json` with `build`, `lint`, `check-types`, and (where relevant) `dev` scripts so Turbo can pick them up.

## Commands

Run from the repo root:

- `pnpm build` — `turbo run build` across the workspace
- `pnpm dev` — `turbo run dev` (persistent, no cache)
- `pnpm lint` — `turbo run lint`
- `pnpm check-types` — `turbo run check-types`
- `pnpm format` — Prettier on `**/*.{ts,tsx,md}`

To run a script in a single workspace package: `pnpm --filter <pkg-name> <script>` (e.g. `pnpm --filter qino build`).

No test runner is configured yet — pick one when introducing the first package and wire a `test` task into `turbo.json`.

## Conventions specific to this repo

- Turbo `build` task expects outputs in `.next/**` (excluding cache) or none — adjust `turbo.json` `outputs` if a package emits to `dist/` instead.
- `.env*` files are declared as build inputs in `turbo.json`; don't rely on env vars outside that pattern without updating it.
- When installing packages via `npm`, also use the exact version, so ~ or carret.
