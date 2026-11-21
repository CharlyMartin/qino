#!/usr/bin/env bash
# Prints the Vercel preview URL of a pushed commit once its deploy succeeds:
# `apps/website/scripts/preview-url.sh [ref]`, HEAD by default. It reads
# GitHub's commit statuses, so it works before a PR exists. Exits 1 when the
# deploy fails, has no preview, or doesn't finish in time.
set -u
sha=$(git rev-parse "${1:-HEAD}") || exit 2
repo=$(gh repo view --json nameWithOwner -q .nameWithOwner) || exit 2
tries=45
interval=20

state=
for try in $(seq 1 $tries); do
  # Newest first, so the first Vercel status is the current one.
  state=$(gh api "repos/$repo/commits/$sha/statuses" \
    -q '[.[] | select(.context == "Vercel")][0].state // ""')
  case $state in
    success) break ;;
    failure | error)
      echo "Vercel's deploy of $sha failed: gh api repos/$repo/commits/$sha/statuses" >&2
      exit 1
      ;;
  esac
  if [ "$try" = 1 ]; then echo "waiting for Vercel's deploy of $sha…" >&2; fi
  sleep $interval
done
if [ "$state" != success ]; then
  echo "Vercel's deploy of $sha didn't finish in $((tries * interval / 60)) minutes" >&2
  exit 1
fi

id=$(gh api "repos/$repo/deployments?sha=$sha&environment=Preview" -q '.[0].id // ""')
if [ -z "$id" ]; then
  echo "$sha has no Vercel preview, only a production deploy" >&2
  exit 1
fi
gh api "repos/$repo/deployments/$id/statuses" -q '.[0].environment_url'
