---
name: codex-review
description: Use after finishing a code change in the Qino monorepo, once tests, types and Biome pass, to have Codex review the diff and apply the relevant findings, repeating until the review is clean. Also use when asked for a Codex review or a second opinion on a diff.
metadata:
  internal: true
---

# Codex review

Codex reviews the diff as a second opinion. You decide which findings are worth applying. Then Codex reviews again, and the loop repeats until a review is clean.

**Do not end your turn, report back, or ask the user between rounds.** Go from one round to the next without stopping. Report only once the loop is over.

## When to skip

- **Clean tree:** `git status --porcelain` is empty and the branch isn't ahead of `main`. Say there's nothing to review and don't call Codex.
- **Docs-only or trivial changes:** for example `apps/website` content, a typo or a comment. There's no code worth reviewing.

## Checks

These must pass before the first round and after every round of fixes:

- `pnpm test`
- `pnpm check-types`
- `pnpm biome check .`

Fix any failures before calling Codex: it shouldn't spend time on problems the checks already catch.

## Running Codex

Pick the scope:

- Uncommitted work: `codex review --uncommitted "<prompt>" 2>/dev/null`
- Committed work on a feature branch: `codex review --base main "<prompt>" 2>/dev/null`

`2>/dev/null` drops Codex's progress logs, so only the review itself is left. It also hides errors: if the output is empty, run the command again without the redirect to see what went wrong.

Use a Bash timeout of `600000`, because a review can take several minutes. Prompt for round 1:

```
Focus on correctness bugs first: wrong behavior, missed edge cases, missing tests for important functions. Then check the conventions in AGENTS.md: one function per file named after it, inferred return types, `==` unless types differ, named types instead of inline ones.
```

## Triage

Check every finding against the code before you act on it. Codex can be wrong.

- **Apply:** real bugs, missed edge cases, AGENTS.md violations, missing tests.
- **Skip:** suggestions that go against AGENTS.md (adding explicit return types, swapping `==` for `===` when the types match, inlining types), speculative refactors, changes outside the task's scope, and claims you couldn't confirm.

Give a short reason for every finding you skip. For convention suggestions, name the AGENTS.md rule they break.

Apply the accepted fixes, then run the checks again until they pass.

## The loop

After each round of fixes, run Codex again right away with the round 1 prompt plus:

```
This is follow-up review number <n>. Findings from earlier reviews were applied. Check that the fixes are correct and didn't introduce regressions. These findings were already considered and rejected, don't raise them again: <one line per skipped finding, with the reason>.
```

**The review is clean** when Codex reports no findings, or when you skip every finding it reports. Since nothing changed in that round, another review would see the same diff. Stop the loop there.

**Stop after 5 rounds anyway.** If the review still isn't clean, it's probably going in circles: fixes are causing new findings, or Codex keeps raising the same point. Don't start a sixth round. List the open findings in the report and **don't continue to the next step of the workflow (committing and opening a PR)**. The user decides.

## Report

Give one table per round:

| Finding | Decision | Reason |
| ------- | -------- | ------ |
| …       | Applied  | …      |
| …       | Skipped  | …      |

End with the number of rounds, whether the review ended clean, and the final status of the checks.
