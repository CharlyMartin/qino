---
name: codex-review
description: Second-opinion review from Codex on a finished, green diff. Use at the end of a code change, or when asked for a Codex review.
metadata:
  internal: true
---

# Codex review

Codex reviews the diff, you triage its findings, and the loop repeats until a review is clean. Run the rounds back to back: the report comes once, when the loop ends.

## 1. Run Codex

The checks from AGENTS.md are green before every round.

Pick the scope:

- Uncommitted work: `codex review --uncommitted "<prompt>" 2>/dev/null`
- Committed work on a feature branch: `codex review --base main "<prompt>" 2>/dev/null`

`2>/dev/null` drops Codex's progress logs, and its errors with them: if the output is empty, run the command again without the redirect to see the error.

Use a Bash timeout of `600000`. Prompt for round 1:

```
Focus on correctness bugs first: wrong behavior, missed edge cases, missing tests for important functions. Then check the AGENTS.md conventions.
```

From round 2 on, add:

```
This is review round <n>, a follow-up review. Findings from earlier reviews were applied. Check that the fixes are correct and didn't introduce regressions. These findings were already considered and rejected, don't raise them again: <one line per skipped finding, with the reason>.
```

## 2. Triage

Every finding gets **Applied** or **Skipped**, with a reason.

- **Apply:** bugs, missed edge cases, AGENTS.md violations, missing tests.
- **Skip:** false positives, out-of-scope changes, and suggestions that contradict AGENTS.md, such as explicit return types, `===` on matching types or inline types. For those, name the AGENTS.md rule.

Apply the fixes, then get the checks green again.

## 3. Loop until clean

The review is **clean** when a round ends with nothing applied: Codex found nothing, or you skipped every finding. Then stop.

The loop has a limit of 5 rounds. If round 5 isn't clean, stop there and report the review as **not clean**, with its open findings. The next move is the user's.

## 4. Report

One table per round:

| Finding | Decision | Reason |
| ------- | -------- | ------ |
| …       | Applied  | …      |
| …       | Skipped  | …      |

End with the number of rounds, **clean** or **not clean** (and, if not clean, that the 5-round limit was hit), and the status of the checks.
