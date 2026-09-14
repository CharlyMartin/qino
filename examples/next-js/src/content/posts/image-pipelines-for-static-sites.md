---
title: "Image Pipelines for Static Sites"
created-on: "2025-05-09T10:30:00Z"
updated-on: "2025-05-16T15:00:00Z"
image: "https://picsum.photos/seed/image-pipelines-for-static-sites/1200/630"
author: "authors/yuki-sato.json"
categories:
  - "categories/performance.json"
  - "categories/tooling.json"
---

Images are the single biggest performance lever on most blogs. Get the pipeline right and you get fast pages, low bandwidth bills, and good Core Web Vitals — all without thinking about it again.

A reasonable default pipeline:

1. Author drops a high-res original into `public/images/`.
2. Build step generates AVIF + WebP at 480w, 768w, 1024w, and 1920w.
3. The component emits a `<picture>` with a proper `srcset`.
4. The originals are kept, but never served.

```bash
sharp input.jpg -o output.avif --resize 1024 --quality 70
```

The trickiest part isn't the resizing — it's making sure the build is *incremental*. Re-encoding 2,000 images on every CI run will eat your build minutes. Cache by content hash and skip what hasn't changed.
