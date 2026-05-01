---
title: "Designing for Content Editors"
created-on: "2025-04-19T09:00:00Z"
updated-on: "2025-04-22T13:30:00Z"
image: "https://picsum.photos/seed/designing-for-content-editors/1200/630"
author: "authors/amara-okonkwo.json"
categories:
  - "categories/editorial.json"
  - "categories/philosophy.json"
---

The biggest mistake developers make when building a CMS is treating the editor as a power user. They aren't. They're someone with a deadline who needs to ship a post by 4pm and would rather not think about your data model.

The principles that fall out of that:

- **One field, one job.** Don't combine "title" and "subtitle" into a single textarea with a separator.
- **Meaningful errors.** "Schema validation failed: title is required" is fine. "Something went wrong" is not.
- **Preview close to writing.** A 500ms preview cycle is fine. A "publish to staging to see the result" loop is not.

> Good editorial UX is the difference between a CMS that's used and one that's worked around.

The flat-file model doesn't automatically give you good UX. It gives you the *option* to build it without fighting the storage layer.
