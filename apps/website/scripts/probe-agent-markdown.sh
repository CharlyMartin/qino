#!/usr/bin/env bash
# Checks how the site answers Markdown and HTML requests, against a running
# server: `scripts/probe-agent-markdown.sh http://localhost:3000`. It follows
# redirects, and exits 1 when any answer differs from the one expected.
set -u
base=${1:?usage: probe-agent-markdown.sh <base-url>}
failed=0

# probe <status> <markdown|html> <method> <path> [accept]
probe() {
  local status=$1 kind=$2 method=$3 path=$4 accept=${5:-}
  local args=(-sL -o /dev/null -X "$method" -w '%{http_code}|%header{content-type}|%header{vary}')
  [ "$method" = HEAD ] && args=(-sLI -o /dev/null -w '%{http_code}|%header{content-type}|%header{vary}')
  [ -n "$accept" ] && args+=(-H "Accept: $accept")
  local got
  got=$(curl "${args[@]}" "$base$path")
  local code=${got%%|*} rest=${got#*|}
  local type=${rest%%|*} vary=${rest#*|}

  local ok=1
  [ "$code" = "$status" ] || ok=0
  case $kind in
    markdown) [[ $type == text/markdown* && ${vary,,} == *accept* ]] || ok=0 ;;
    html) [[ $type == text/html* ]] || ok=0 ;;
  esac

  if [ $ok = 1 ]; then echo "ok   $method $path [${accept:-no Accept}] -> $code $type"
  else echo "FAIL $method $path [${accept:-no Accept}] -> $code $type, Vary: $vary; expected $status $kind"; failed=1
  fi
}

# Entry and index pages, by Accept.
for path in /docs/guide/cli /docs/guide /blog/why-another-cms /docs /blog; do
  probe 200 markdown GET "$path" "text/markdown"
  probe 200 markdown GET "$path" "text/x-markdown"
  probe 200 html GET "$path" "text/html"
  probe 200 html GET "$path" "*/*"
  probe 200 html GET "$path" "text/html, text/markdown"
  probe 200 html GET "$path"
done

# Markdown URLs answer Markdown whatever Accept says, a trailing slash
# included, and unknown ones get the Markdown 404.
for path in /docs/guide/cli.md /docs/guide.md /blog/why-another-cms.md /docs.md /blog.md /docs/guide/cli.md/ /docs.md/ /blog.md/; do
  probe 200 markdown GET "$path"
  probe 200 markdown GET "$path" "text/html"
done
probe 200 markdown HEAD /docs/guide/cli.md
probe 404 markdown GET /docs/nope.md
probe 404 markdown GET /blog/nope.md

exit $failed
