# npm package hygiene from Total TypeScript article

Source: https://www.totaltypescript.com/how-to-create-an-npm-package

## Context

Article describes a baseline npm package setup: TS strict tsconfig, Prettier, Vitest, GitHub Actions CI on PR + push to main, Changesets, `files`/`exports`, `prepublishOnly` gate. `packages/cms` already exceeds it (tsdown, ESM-only exports, publint + attw `check-dist`, type tests, changesets, CI). Only 3 small gaps remain. Everything else in the article is already done or intentionally different (Biome instead of Prettier for code, bundler resolution instead of NodeNext, `exports` instead of `main`).

## Gaps worth closing

### 1. CI doesn't run on `main`

`.github/workflows/ci.yml` triggers on `pull_request` only. Article runs on PR **and** push to `main`, so a broken merge (or direct push) is caught. Cheap, no downside.

- Edit `.github/workflows/ci.yml`:
  ```yaml
  on:
    pull_request:
    push:
      branches: [main]
  ```

### 2. No pre-publish gate

Article: `prepublishOnly` runs the full CI script so a manual publish can't skip checks. Repo: `pnpm release` = `turbo run build --filter=qino && changeset publish`. `check-dist` (tsc against dist, import smoke test, publint, attw), `check-types` and `test` only run in CI, never on the publish path.

- Add to `packages/cms/package.json` scripts:
  ```json
  "prepublishOnly": "pnpm build && pnpm check-types && pnpm test && pnpm check-dist"
  ```
  Lifecycle order on `pnpm publish` is `prepublishOnly` → `prepare` → pack, so `pnpm build` is needed first because `check-dist` needs `dist/`. `prepublishOnly` doesn't fire on `pnpm pack`, so no recursion with `check-dist`'s inner `pnpm pack`.
- Leave root `release` script as-is; the gate now lives in the package, which also covers a bare `pnpm publish`.

### 3. Two strict tsconfig flags missing

Article's tsconfig has `noImplicitOverride` and `moduleDetection: "force"`. `packages/cms/tsconfig.json` has every other strictness flag it lists. Both are no-ops today (no classes in `src/`, every file is a module) but cost nothing and stop regressions.

- Add to `packages/cms/tsconfig.json` compilerOptions:
  ```json
  "noImplicitOverride": true,
  "moduleDetection": "force"
  ```
- Don't touch `examples/next-js/tsconfig.json` (Next-managed).

## Skipped on purpose

- `.prettierrc` — code is Biome; Prettier only formats md with defaults. Fine.
- `module: NodeNext` / `main` field / `tsc` build — tsdown + `exports` + `publishConfig` already validated by publint/attw.
- `sourceMap` / `declarationMap` — `src/` isn't in `files`, so maps would point at nothing. Could add `sourcemap: true` to `tsdown.config.ts` for CLI stack traces; see doubts.
- Changesets `commit: true` — repo uses `false`; keep, version bumps go through PRs.
- Author `Name <email>` — cosmetic.

## Files to change

- `.github/workflows/ci.yml`
- `packages/cms/package.json`
- `packages/cms/tsconfig.json`
- New: `plans/2026-09-15-npm-package-hygiene.md` (this plan, copied verbatim once approved — `plans/` doesn't exist yet)

No changeset needed: none of this alters the published package contents.

## Verification

1. `pnpm --filter qino check-types` — passes with new flags.
2. `pnpm --filter qino test` — unchanged.
3. `pnpm --filter qino exec pnpm publish --dry-run --no-git-checks` — confirm `prepublishOnly` runs build → check-types → test → check-dist and exits 0, then tarball listing shows only `dist`, `README.md`, `LICENSE`, `package.json`.
4. Push branch, open PR — CI runs. After merge, confirm a CI run appears on the `main` push.

## Doubts / questions for you

1. Add `sourcemap: true` to `tsdown.config.ts`? Helps CLI stack traces; adds `.map` files to the tarball (a few KB). Not in this plan unless you want it.
2. Should the plan file live at `plans/2026-09-15-npm-package-hygiene.md` (date prefix) or do you prefer another id scheme?
3. `AGENTS.md` still says `packages/` is empty and no test runner exists. Out of scope for the article, but worth a separate cleanup PR — want that queued?
