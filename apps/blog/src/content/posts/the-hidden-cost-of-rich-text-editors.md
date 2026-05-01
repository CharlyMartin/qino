---
title: "The Hidden Cost of Rich Text Editors"
created-on: "2025-04-08T08:30:00Z"
updated-on: "2025-04-14T11:00:00Z"
image: "https://picsum.photos/seed/the-hidden-cost-of-rich-text-editors/1200/630"
---

A rich text editor looks like a feature. It's actually a liability — one you don't notice until it's too late to remove.

The cost shows up in three places:

## Storage

Most rich text editors persist some flavor of HTML or a proprietary JSON tree. Both are coupled to the editor's version. Upgrade the editor, get a migration.

## Output

Rich text editors produce *markup*, not *meaning*. You get `<span style="font-weight: bold">` instead of `<strong>`. That difference matters when you ship the same content to RSS, AMP, or email.

## Lock-in

Try moving 5,000 documents out of a rich text editor. The export is never lossless. Markdown export drops attributes; HTML export drops semantics.

Plain text doesn't have any of these problems. The editor is replaceable because the format is the contract.
