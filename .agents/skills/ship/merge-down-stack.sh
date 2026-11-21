#!/usr/bin/env bash
# Merges a base into the first branch of a ticket stack, then each branch into
# the next, without rebasing:
# `.claude/skills/ship/merge-down-stack.sh main feat/a feat/b ...`. After each
# merge it runs that branch's own checks, the `run:` steps of its CI
# workflow's `test` job, since an older branch can predate `pnpm check`. It
# stops at a conflict or a failing check: fix it, commit, and run the same
# command again, which skips the merges already done. It never pushes.
set -u
cd "$(git rev-parse --show-toplevel)" || exit 2
if [ $# -lt 2 ]; then
  echo "usage: merge-down-stack.sh <base> <branch>..." >&2
  exit 2
fi
if [ -n "$(git status --porcelain --untracked-files=no)" ]; then
  echo "commit or stash your changes first" >&2
  exit 2
fi
logs=$(mktemp -d)

# The current branch's CI checks: its `test` job's `run:` steps, after the
# install.
ci_steps() {
  awk '/^  test:/ { job = 1; next } /^  [a-z]/ { job = 0 }
    job && /^ *- run: / { sub(/^ *- run: /, ""); print }' .github/workflows/ci.yml |
    grep -v '^pnpm install'
}

prev=$1
shift
for branch in "$@"; do
  git switch -q "$branch" || exit 2
  if [ "$(git rev-list --count "$branch..$prev")" = 0 ]; then
    echo "$branch already has $prev"
  elif git merge --no-edit -q "$prev"; then
    echo "merged $prev into $branch"
  else
    echo "conflict merging $prev into $branch: resolve it, commit, and run this again" >&2
    git diff --name-only --diff-filter=U >&2
    exit 1
  fi

  log=$logs/${branch//\//-}.log
  if ! pnpm install --frozen-lockfile >"$log" 2>&1; then
    echo "pnpm install failed on $branch: $log" >&2
    exit 1
  fi
  while IFS= read -r step; do
    # Without stdin, so a step can't read the remaining steps.
    if ! bash -c "$step" >>"$log" 2>&1 </dev/null; then
      echo "\`$step\` failed on $branch: $log" >&2
      exit 1
    fi
  done < <(ci_steps)
  echo "  checks pass"
  prev=$branch
done
