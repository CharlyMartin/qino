#!/usr/bin/env bash
# Checks how the site answers Markdown and HTML requests, against a deploy:
# `apps/website/scripts/probe-agent-markdown.sh https://<preview>.vercel.app`.
# With `--dev`, against a dev server, it skips what only Vercel's routes add:
# `Link` and `Vary: Accept` on pages, and the homepage's agent Markdown. It follows
# redirects, and exits 1 when an answer differs from the one expected.
set -u
dev=0
if [ "${1:-}" = --dev ]; then
  dev=1
  shift
fi
if [ $# -ne 1 ]; then
  echo "usage: probe-agent-markdown.sh [--dev] <base-url>" >&2
  exit 2
fi
base=$1
failed=0
# The `Link` the next probes expect, when set.
want_link=

# probe <status> <markdown|html> <method> <path> [accept]
probe() {
  local status=$1 kind=$2 method=$3 path=$4 accept=${5:-}
  local args=(-sL -o /dev/null -w '%{http_code}|%header{content-type}|%header{vary}|%header{link}')
  if [ "$method" = HEAD ]; then args+=(-I); fi
  if [ -n "$accept" ]; then args+=(-H "Accept: $accept"); fi
  local got code type vary got_link
  got=$(curl "${args[@]}" "$base$path")
  code=${got%%|*}
  got=${got#*|}
  type=${got%%|*}
  got=${got#*|}
  vary=${got%%|*}
  got_link=${got#*|}

  local ok=1
  [ "$code" = "$status" ] || ok=0
  # A negotiated answer's Vary lists Accept itself, not only Accept-Encoding.
  # A Markdown URL never varies, so it needs none.
  local varies=1
  [[ ",${vary// /}," == *,[Aa]ccept,* ]] || varies=0
  case $kind in
    markdown)
      [[ $type == text/markdown* ]] || ok=0
      if [[ $path != *.md && $path != *.md/ ]]; then
        [ $varies = 1 ] || ok=0
      fi
      ;;
    html) [[ $type == text/html* ]] || ok=0 ;;
    *) echo "unknown kind: $kind" >&2; exit 2 ;;
  esac
  if [ -n "$want_link" ]; then
    [ "$got_link" = "$want_link" ] || ok=0
    [ $varies = 1 ] || ok=0
  fi

  local line="$method $path [${accept:-no Accept}] -> $code $type"
  if [ $ok = 1 ]; then
    echo "ok   $line"
  else
    echo "FAIL $line, Vary: $vary, Link: $got_link; expected $status $kind${want_link:+, Link: $want_link}"
    failed=1
  fi
}

# expect_link <link>: the `Link` the next probes expect, on a deploy.
expect_link() {
  if [ $dev = 0 ]; then want_link=$1; fi
}

# The site's URL, `siteUrl`, which canonical URLs use on every deploy.
site=https://www.qino.works

# expect_frontmatter <path> <page path> [accept]: the answer opens with a
# frontmatter block whose canonical URL is the page's.
expect_frontmatter() {
  local path=$1 canonical=$site$2 accept=${3:-}
  local args=(-sL)
  if [ -n "$accept" ]; then args+=(-H "Accept: $accept"); fi
  local body
  body=$(curl "${args[@]}" "$base$path")
  local line="GET $path [${accept:-no Accept}] opens with a frontmatter block, canonical $canonical"
  if [[ $body == $'---\ntitle: "'* && $body == *$'\ncanonical: "'"$canonical"$'"\n---\n'* ]]; then
    echo "ok   $line"
  else
    echo "FAIL $line; got: ${body:0:160}"
    failed=1
  fi
}

# Entry and index pages, by Accept. TanStack Start answers 406 to an Accept
# without HTML or `*/*`, so `text/plain` checks the HTML fallback.
for path in /docs/guide/cli /docs/guide /blog/why-another-cms /docs /blog; do
  expect_link "<$path.md>; rel=\"alternate\"; type=\"text/markdown\""
  probe 200 markdown GET "$path" "text/markdown"
  probe 200 markdown GET "$path" "text/x-markdown"
  probe 200 markdown GET "$path" "text/markdown, text/html, */*"
  probe 200 html GET "$path" "text/html"
  probe 200 html GET "$path" "*/*"
  probe 200 html GET "$path" "text/html, text/markdown"
  probe 200 html GET "$path" "text/plain"
  probe 200 html GET "$path" "text/markdown;q=0"
  # A quoted parameter's `,` and `;` are data, so this `q=0` still counts.
  probe 200 html GET "$path" 'text/markdown;note="a,b";q=0, text/html'
  probe 200 html GET "$path"
done
want_link=

# The homepage's agent Markdown is the prerendered `/index.md`, which only
# Vercel's routes serve at `/`.
if [ $dev = 0 ]; then
  expect_link '</index.md>; rel="alternate"; type="text/markdown", </llms.txt>; rel="describedby"'
  probe 200 markdown GET / "text/markdown"
  probe 200 html GET / "text/html"
  probe 200 html GET /
  want_link=
fi

# A page without agent Markdown falls back to HTML.
probe 200 html GET /contentlayer-exit "text/markdown"
probe 200 html GET /contentlayer-exit "text/plain"

# Markdown URLs answer Markdown whatever Accept says, a trailing slash
# included.
for path in /docs/guide/cli.md /docs/guide.md /blog/why-another-cms.md /docs.md /blog.md /docs/guide/cli.md/ /docs.md/ /blog.md/; do
  probe 200 markdown GET "$path"
  probe 200 markdown GET "$path" "text/html"
done
probe 200 markdown HEAD /docs/guide/cli.md

# Agent Markdown opens with a frontmatter block, at Markdown URLs and through
# negotiation.
for page in /docs/guide/cli /docs/guide /blog/why-another-cms /docs /blog; do
  expect_frontmatter "$page.md" "$page"
  expect_frontmatter "$page" "$page" "text/markdown"
done
# Including the homepage's, at `/` on a deploy.
expect_frontmatter /index.md /
if [ $dev = 0 ]; then expect_frontmatter / / "text/markdown"; fi

# Unknown paths get the Markdown 404 when they want Markdown, and the HTML
# one otherwise.
for path in /docs/nope /blog/nope /nope; do
  probe 404 markdown GET "$path" "text/markdown"
  probe 404 html GET "$path"
done
for path in /docs/nope.md /blog/nope.md /blog/a/b.md /nope.md; do
  probe 404 markdown GET "$path"
done

exit $failed
