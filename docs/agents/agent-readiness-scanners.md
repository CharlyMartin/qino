# Agent-readiness scanners

How to run the three scanners that check whether a site serves agents well, from a shell. isitagentready's and acceptmarkdown's web pages render with JavaScript, so fetching one returns no results; call their APIs instead. Replace `<url>` with the deployment to check, such as the Vercel preview URL that `apps/website/scripts/preview-url.sh` prints, and `<domain>` with its host.

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

`GET https://is-agentic.com/api/v1/report?url=<url-encoded url>` reads the same latest report. `issues` lists the failing and partial checks that the score counts, each with an `id`, a `tier` and a `result`, and `eligible_checks` counts the scored checks that applied. Some checks aren't scored and are left out of `issues` even when they fail, such as `markdown-frontmatter` and `modular-llms-txt`. Read each check's status from the scan page instead.

`https://is-agentic.com/scan/<domain>` shows the same report, and its HTML embeds every check, over a hundred, as escaped JSON: `{"id":"…","name":"…","tier":"…","bonus":…,"score":…,"status":"…","details":"…","recommendation":"…"}`. `status` is `pass`, `fail`, `warning` (partial credit) or `na` (didn't run). Its `tier` and `bonus` don't say whether the score counts a check, and its tiers aren't the API's. The scan script reads its checks from there.

`brand-search-accuracy` searches the brand with the leading JSON-LD `keywords` terms (it took two), whether or not the page shows them; a comma-separated string works. It passes when the domain ranks in the top 10, and its `details` name the searches it ran.

On a preview deploy, three things skew the report:

- **Sampling:** the preview's sitemap lists the production URLs, so the scan samples no inner page, and checks such as `content-no-js` pass on the homepage alone. Their `details` say so.
- **Links:** links built on `siteUrl` point at production. Checks that follow them fail or warn for files the preview serves and production doesn't yet. `llms-txt-links-resolve` reports such links as not resolving, and `markdown-link-alternate` as answering HTML. Both pass once production serves the files, and their `details` name the production URLs.
- **Search:** a preview isn't indexed, and Vercel sends it `X-Robots-Tag: noindex`, so `noindex-directives` and `agentic-search-specific` fail, and `brand-search-accuracy` never finds the host, though its `details` still name the terms it searched. `public-api` fails on previews too, for a reason its `details` don't give. Read these four checks' statuses on production's report.

## acceptmarkdown.com

One POST streams server-sent events: an `init` event listing the checks, one `check` event per check with its `status`, then `done` with the score:

```sh
curl -sN -X POST https://acceptmarkdown.com/api/readiness \
  -H "content-type: application/json" \
  -d '{"url":"<url>"}'
```

It checks four things: `serves-markdown`, `varies-by-accept`, `rejects-unsupported` (406) and `q-values`. `rejects-unsupported` always warns, because qino never answers 406. `q-values` sends `text/html;q=1.0, text/markdown;q=0.5`, so it passes on a prerendered site too, though a host rewrite there can't weigh q-values.
