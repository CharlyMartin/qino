---
name: implement
description: "Implement a piece of work based on a spec or set of tickets."
disable-model-invocation: true
---

Implement the work described by the user in the spec or tickets.

If the user passes a ticket reference, fetch it from the issue tracker and state its title before starting. If the reference is ambiguous, ask. When the ticket has a parent, read the parent's body and comments too: decisions taken while implementing earlier tickets are recorded there.

When you take a decision the spec doesn't cover (a name, an edge-case rule, where a module lives), add it under the ticket's heading in the parent's "Decisions while implementing" comment, so the next ticket follows it. If the parent has no such comment yet, post it. A ticket without a parent records its decisions in its PR description instead.

Call the Skill tool with "tdd" where possible, at pre-agreed seams.

Run typechecking regularly, single test files regularly, and the full test suite once at the end.

Once done, commit your work to the current branch, then call the Skill tool with "code-review" to review it against the branch's base (the `ship` skill's step 5 names it).
