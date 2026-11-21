# Agent-readiness scanners

How to run the three scanners that check whether a site serves agents well, from a shell. Their web pages render with JavaScript, so fetching a page returns no results; call their APIs instead. Replace `<url>` with the deployment to check, such as the Vercel preview URL that `apps/website/scripts/preview-url.sh` prints, and `<domain>` with its host.

`node apps/website/scripts/scan-agent-readiness.mjs <url> [path...]` runs all three and prints one line per content check. Reach for the commands below when you need a check it doesn't print, or a check's evidence.

## isitagentready.com

One POST runs the checks listed in `enabledChecks`. Each result sits under `checks.<category>.<check>` with a `status` (`pass`, `fail`, `neutral`) and the `evidence` it gathered:

```sh
curl -s -X POST https://isitagentready.com/api/scan \
  -H "Content-Type: application/json" \
  -d '{"url":"<url>","enabledChecks":["robotsTxt","sitemap","linkHeaders","markdownNegotiation","robotsTxtAiRules","contentSignals"]}'
```

The content checks are `linkHeaders` (under `discoverability`) and `markdownNegotiation` (under `contentAccessibility`). Only the HTTP `Link` header counts, not `<link>` tags, and only some `rel` values pass, such as `alternate` and `describedby`.

## is-agentic.com

The CLI scans a domain only when it has no completed report yet, and otherwise returns that report. So scan a deployment's own URL, such as `<project>-<hash>.vercel.app`, rather than a branch alias that earlier scans already cover. The report is fresh when its `scanned_at` is later than the deployment:

```sh
npx is-agentic <domain> --json
```

`GET https://is-agentic.com/api/v1/report?url=<url-encoded url>` reads the same latest report. `issues` lists only the checks that failed or passed partially, each with an `id`, a `tier` and a `result`: a check whose `id` is absent passed or didn't apply, and `eligible_checks` counts the ones that applied. The content checks are `markdown-negotiation-vary`, `agent-friendly-404` and `agent-instruction`.

## acceptmarkdown.com

One POST streams server-sent events: an `init` event listing the checks, one `check` event per check with its `status`, then `done` with the score:

```sh
curl -sN -X POST https://acceptmarkdown.com/api/readiness \
  -H "content-type: application/json" \
  -d '{"url":"<url>"}'
```

It checks four things: `serves-markdown`, `varies-by-accept`, `rejects-unsupported` (406) and `q-values`. `rejects-unsupported` always warns, because qino never answers 406. `q-values` sends `text/html;q=1.0, text/markdown;q=0.5`, so it passes on a prerendered site too, though a host rewrite there can't weigh q-values.
