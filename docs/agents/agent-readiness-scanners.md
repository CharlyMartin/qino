# Agent-readiness scanners

How to run the three scanners that check whether a site serves agents well, from a shell. Their web pages render with JavaScript, so fetching a page returns no results; call their APIs instead. Replace `<url>` with the deployment to check, such as a Vercel preview URL.

## isitagentready.com

One POST runs the checks listed in `enabledChecks`. Each result sits under `checks.<category>.<check>` with a `status` (`pass`, `fail`, `neutral`) and the `evidence` it gathered:

```sh
curl -s -X POST https://isitagentready.com/api/scan \
  -H "Content-Type: application/json" \
  -d '{"url":"<url>","enabledChecks":["robotsTxt","sitemap","linkHeaders","markdownNegotiation","robotsTxtAiRules","contentSignals"]}'
```

The content checks are `linkHeaders` (under `discoverability`) and `markdownNegotiation` (under `contentAccessibility`). Only the HTTP `Link` header counts, not `<link>` tags, and only some `rel` values pass, such as `alternate` and `describedby`.

## is-agentic.com

The CLI creates a report when the domain has none, so a fresh preview URL gets a fresh scan:

```sh
npx is-agentic <domain> --json
```

`GET https://is-agentic.com/api/v1/report?url=<url-encoded url>` reads the latest completed report without scanning again. Results are in `issues`, each with an `id`, a `tier` and a `result`. The content checks are `markdown-negotiation-vary`, `agent-friendly-404` and `agent-instruction`.

## acceptmarkdown.com

One POST streams server-sent events: an `init` event listing the checks, one `check` event per check with its `status`, then `done` with the score:

```sh
curl -sN -X POST https://acceptmarkdown.com/api/readiness \
  -H "content-type: application/json" \
  -d '{"url":"<url>"}'
```

It checks four things: `serves-markdown`, `varies-by-accept`, `rejects-unsupported` (406) and `q-values`. qino never answers 406, and a host rewrite can't read q-values, so those two warn on a prerendered site.
