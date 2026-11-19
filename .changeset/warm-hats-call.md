---
"@qino/cms": minor
---

Adds `negotiateMarkdown`, which answers agents that ask for Markdown from any route or middleware that works with Web `Request` and `Response` objects, such as TanStack Start handlers and Next.js route handlers. It serves the Markdown your loader returns when the request's path ends in `.md` or its `Accept` header prefers `text/markdown` to HTML, and resolves to `null` otherwise, so your route renders the HTML page:

```ts
import { negotiateMarkdown } from "@qino/cms";

const response = await negotiateMarkdown(request, () => loadMarkdown(slug));
return response ?? renderPage();
```

Responses carry `Content-Type: text/markdown; charset=utf-8` and `Vary: Accept`. A loader that returns `null` gets a Markdown 404 linking to `/llms.txt`. It never answers 406.
