---
title: "Migrating Off WordPress"
created-on: "2025-12-28T09:00:00Z"
updated-on: "2026-01-05T13:30:00Z"
image: "https://picsum.photos/seed/migrating-off-wordpress/1200/630"
author: "authors/priya-krishnan.json"
---

WordPress runs ~40% of the web for good reasons. It's also the CMS people most often want to leave, for reasons just as good.

A migration plan that's worked for me, more than once:

1. **Export.** Use the built-in WXR export, or `wp-cli` for a cleaner dump.
2. **Convert.** A script transforms WXR into Markdown + frontmatter. Tools like `wordpress-export-to-markdown` get you 80% of the way.
3. **Reconcile shortcodes.** WordPress shortcodes (`[gallery]`, `[caption]`) need bespoke handling. Inventory yours first.
4. **Images.** WP stores them at messy paths. Move to `public/images/` and rewrite references.
5. **Redirects.** Set up `permalink → new-slug` mappings in your hosting layer. *Don't skip this.* Backlinks are worth more than your migration is.
6. **Soak.** Run both sites in parallel for a week. Compare traffic. Fix what's broken.

The hardest part isn't the migration. It's all the plugins doing things you forgot were happening.
