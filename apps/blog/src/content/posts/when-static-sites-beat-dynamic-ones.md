---
title: "When Static Sites Beat Dynamic Ones"
created-on: "2025-01-15T14:20:00Z"
updated-on: "2025-01-21T09:30:00Z"
image: "https://picsum.photos/seed/when-static-sites-beat-dynamic-ones/1200/630"
author: "authors/yuki-sato.json"
---

Static sites aren't a nostalgia trip. For a large class of sites — blogs, docs, marketing pages — they're simply *better*. Faster, cheaper, more reliable.

The mental model is: *do the work once, at build time, and serve the result forever*. The tradeoff is that "build time" gets longer as your content grows. But CPU at build time is fundamentally cheaper than CPU at request time, served at scale.

---

You start losing the static advantage when:

- Content depends on the requesting user.
- Content updates faster than you can rebuild.
- You need server-side state per request.

Below those thresholds, static wins on every dimension that matters.
