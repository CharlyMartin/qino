#!/usr/bin/env bash
# Fails when @qino/cms reached the browser's assets, after a website build:
# `apps/website/scripts/check-client-bundle.sh`. The build only warns when a
# client module imports qino, since it externalizes Node built-ins for the
# browser. Each marker is a string from qino's runtime that minification
# keeps: a config key, a primitive's method, and `negotiateMarkdown`'s 404
# body.
set -u
cd "$(dirname "$0")/.." || exit 2
markers=(contentFolder getAgentMarkdown "for the pages that do")

assets=()
for dir in .output/public/assets .vercel/output/static/assets; do
  if ls "$dir"/*.js >/dev/null 2>&1; then assets+=("$dir"); fi
done
if [ ${#assets[@]} = 0 ]; then
  echo "no client scripts: build the website first" >&2
  exit 2
fi

failed=0
for marker in "${markers[@]}"; do
  # A marker qino no longer contains would pass every build.
  if ! grep -rqF -- "$marker" ../../packages/cms/src; then
    echo "@qino/cms no longer contains \"$marker\": pick another marker" >&2
    failed=1
  fi
  files=$(grep -rlF -- "$marker" "${assets[@]}")
  if [ -n "$files" ]; then
    echo "qino reached the client: \"$marker\" in" $files >&2
    failed=1
  fi
done
exit $failed
