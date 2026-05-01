---
title: "Localization in a Flat-File World"
created-on: "2025-05-21T09:00:00Z"
updated-on: "2025-05-30T11:30:00Z"
image: "https://picsum.photos/seed/localization-in-a-flat-file-world/1200/630"
---

Localization is the part where flat-file CMSes start to feel their limits. There's no single right answer, but there are two patterns that work.

## File-per-locale

```
content/blog/
  hello.en.md
  hello.fr.md
  hello.ja.md
```

Pros: simple, greppable, no special tooling. Cons: drift — `hello.en.md` updates and the translations don't.

## Locale subfolders

```
content/blog/
  en/hello.md
  fr/hello.md
  ja/hello.md
```

Same trade-offs, just laid out differently. Some teams prefer this because it makes "everything English" or "everything French" easy to operate on.

The drift problem is real either way. The fix isn't structural — it's a `translations-stale` check at build time, comparing `updated-on` across locales.
