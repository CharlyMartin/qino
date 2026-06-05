# Cloud UI

**Status:** v2-deferred
**Version:** v2

## Intent

A browser-based editing surface for content editors. They never touch the IDE — they sign in, pick the project, edit Markdown / JSON content, hit publish.

The cloud UI's only contract with a Qino project is `qino-lock.json` on GitHub. It does not import any TS files from the consumer's repo.

> **Status note (V1):** `qino-lock.json` generation has been removed from the CLI
> while the cloud UI is on hold. It will return as an opt-in (`--ui` / `ui: true`)
> when this spec is picked up. See `11-lock-file.md`.

## Read path

1. Editor authenticates.
2. Cloud UI fetches `qino/qino-lock.json` from the project's GitHub repo.
3. From the lock file: collection list, page list, tree list, schemas, relations, asset declarations, timestamp markers.
4. UI renders dashboards, forms, file pickers, ordering tools.
5. Content files themselves are fetched on demand from GitHub (per-entry, not bulk).

## Write path — both modes supported

Editors choose per-edit (or per-project default):

### Mode A — Direct commit

Save → commit straight to the default branch. Published instantly. Best for solo authors and small teams without review.

### Mode B — PR for review

Save → branch + PR. Reviewer approves → merge → published. Best for teams with editorial review.

The toggle is per-edit because a single project might mix workflows: instant for typo fixes, PR for major posts.

## Why deferred

- Depends on a stable lock-file contract (`11-lock-file.md`), which is still being filled in.
- Depends on real-world feedback from V1 users on which schema features the UI actually needs.
- Significant scope: auth, hosting, billing, GitHub App permissions, conflict handling.

## Open questions (held)

- Auth model: GitHub OAuth, magic-link, both?
- Conflict handling: editor A saves while editor B has an open draft of the same file — last-write-wins, optimistic locking, real-time presence?
- Preview: per-PR preview deploys (Mode B), or per-edit preview branches (Mode A)?
- Media uploads: who handles binary writes — GitHub LFS, a separate object store, raw commits to `mediaFolder`?
- Billing model.
- Self-hosting: can a team run the UI themselves, or is it cloud-only?

## Acceptance criteria (when V2 lands)

Done when:

- An editor can sign in, see a project's collections, edit a post, and publish via Mode A or Mode B.
- The cloud UI never reads code from the project — only `qino-lock.json` and content files.
- The asset picker filters by the declarations in `07-assets.md`.
- Custom-ordered collections (`06-sort.md`) can be reordered via drag-and-drop, persisting to the JSON order file.
