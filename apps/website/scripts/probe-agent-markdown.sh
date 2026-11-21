#!/usr/bin/env bash
# Checks how the site answers Markdown and HTML requests, against a running
# server: `apps/website/scripts/probe-agent-markdown.sh http://localhost:3000`.
# It follows redirects, and exits 1 when an answer differs from the one
# expected. Cases under "To do" are reported without failing the run.
set -u
if [ $# -ne 1 ]; then
  echo "usage: probe-agent-markdown.sh <base-url>" >&2
  exit 2
fi
base=$1
failed=0
required=1

# probe <status> <markdown|html> <method> <path> [accept]
probe() {
  local status=$1 kind=$2 method=$3 path=$4 accept=${5:-}
  local args=(-sL -o /dev/null -w '%{http_code}|%header{content-type}|%header{vary}')
  if [ "$method" = HEAD ]; then args+=(-I); fi
  if [ -n "$accept" ]; then args+=(-H "Accept: $accept"); fi
  local got code type vary
  got=$(curl "${args[@]}" "$base$path")
  code=${got%%|*}
  got=${got#*|}
  type=${got%%|*}
  vary=${got#*|}

  local ok=1
  [ "$code" = "$status" ] || ok=0
  case $kind in
    # Vary must list Accept itself, not only Accept-Encoding.
    markdown) [[ $type == text/markdown* && ",${vary// /}," == *,[Aa]ccept,* ]] || ok=0 ;;
    html) [[ $type == text/html* ]] || ok=0 ;;
    *) echo "unknown kind: $kind" >&2; exit 2 ;;
  esac

  local line="$method $path [${accept:-no Accept}] -> $code $type"
  if [ $ok = 1 ]; then
    echo "ok   $line"
  elif [ $required = 1 ]; then
    echo "FAIL $line, Vary: $vary; expected $status $kind"
    failed=1
  else
    echo "todo $line; expected $status $kind"
  fi
}

# Entry and index pages, by Accept.
for path in /docs/guide/cli /docs/guide /blog/why-another-cms /docs /blog; do
  probe 200 markdown GET "$path" "text/markdown"
  probe 200 markdown GET "$path" "text/x-markdown"
  probe 200 markdown GET "$path" "text/markdown, text/html, */*"
  probe 200 html GET "$path" "text/html"
  probe 200 html GET "$path" "*/*"
  probe 200 html GET "$path" "text/html, text/markdown"
  probe 200 html GET "$path"
done
probe 404 markdown GET /docs/nope "text/markdown"

# Markdown URLs answer Markdown whatever Accept says, a trailing slash
# included, and unknown ones get the Markdown 404.
for path in /docs/guide/cli.md /docs/guide.md /blog/why-another-cms.md /docs.md /blog.md /docs/guide/cli.md/ /docs.md/ /blog.md/; do
  probe 200 markdown GET "$path"
  probe 200 markdown GET "$path" "text/html"
done
probe 200 markdown HEAD /docs/guide/cli.md
probe 404 markdown GET /docs/nope.md
probe 404 markdown GET /blog/nope.md

# To do (#365): the spec's HTML fallbacks get TanStack Start's 406, and the
# homepage has no Markdown yet.
required=0
probe 200 html GET /docs/guide/cli "text/plain"
probe 200 html GET /docs/guide/cli "text/markdown;q=0"
probe 200 markdown GET / "text/markdown"

exit $failed
