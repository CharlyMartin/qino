# Qino website

TanStack Start renders the Markdown documentation in `content/docs` through
`@qino/cms`. Section pages include their body and child links. The homepage is a
placeholder; releases are not rendered.

Run commands from the repository root:

```sh
pnpm install
pnpm --filter @qino/cms build
pnpm --filter website dev
pnpm --filter website build
pnpm --filter website preview
```

Use the workspace commands so Qino resolves its content and config relative to
`apps/website`. The website build validates content and generates Qino types before
Vite runs. Keep `src/routeTree.gen.ts` in version control; Vite regenerates it.

The build prerenders `/` and every documentation page into Nitro's public output
(`.output/public` locally, `.vercel/output/static` with the Vercel preset).
`/docs` redirects to the first top-level documentation node and is excluded from
prerendering. The crawler starts at `/docs/guide`; update that seed in
`vite.config.ts` if the guide is renamed or removed.

The docs tree and compiled MDX are also generated during prerendering using
TanStack's experimental static-server-functions middleware. Production client
navigation fetches these results from `/__tsr/staticServerFnCache/*.json` rather
than compiling MDX through a server-function request. Deploy these assets alongside
the HTML; Nitro includes them in Vercel's static output. Keep the Start server
runtime for redirects and requests that are not prerendered.

Links preload on intent (hover, focus, or touch). Docs loader results stay fresh
while retained in the router's cache, using its default retention period. Content
updates require a rebuild; refresh an open page to pick up the new deployment.
Development continues to use live server functions. Unknown docs slugs are checked
against the docs tree and display the existing not-found page. Missing static
assets for known pages are deployment errors, with no runtime compilation fallback.

Checks:

```sh
pnpm --filter website check-types
pnpm --filter website test
pnpm biome check .
```
