# Qino website

TanStack Start renders the Markdown documentation in `content/docs` through
`@qino/cms`. Section pages include their body and child links. The homepage is a
placeholder; releases are not rendered.

Run commands from the repository root:

```sh
pnpm install
pnpm --filter @qino/cms build
pnpm --filter @qino/website dev
pnpm --filter @qino/website build
pnpm --filter @qino/website preview
```

Use the workspace commands so Qino resolves its content and config relative to
`apps/website`. The website build validates content and generates Qino types before
Vite runs. Keep `src/routeTree.gen.ts` in version control; Vite regenerates it.

The build prerenders `/` and every documentation page into `dist/client`.
`/docs` redirects to the first top-level documentation node and is excluded from
prerendering. The crawler starts at `/docs/guide`; update that seed in
`vite.config.ts` if the guide is renamed or removed.

Deployment is not configured. Client navigation calls server functions, so deploy
the Start server runtime alongside the prerendered assets. Serving only
`dist/client` would also require a host-level `/docs` redirect and changes to
navigation or data delivery to avoid runtime server-function requests.

Checks:

```sh
pnpm --filter @qino/website check-types
pnpm --filter @qino/website test
pnpm biome check .
```
