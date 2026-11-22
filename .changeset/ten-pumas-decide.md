---
"@qino/cms": minor
---

Adds a frontmatter block to agent Markdown, so agents get a page's metadata without reading its body. `getAgentMarkdown` on collections, trees and items opens every document with `title`, `description` when there is one, and `canonical`, the page's URL. Each value is a quoted string. An index page's block holds `pages.title` and the index page's URL:

```md
---
title: "Hello"
description: "The first post."
canonical: "https://example.com/blog/hello"
---

# Hello

> The first post.
```

The block takes the title and description from the entry's fields, even when the body opens with its own H1 and gets no heading. The entry's own frontmatter still never reaches agents. `llms-full.txt` joins the documents without their blocks.
