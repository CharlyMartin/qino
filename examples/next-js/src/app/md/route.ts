import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { servePageMarkdown } from "@/lib/serve-page-markdown";

// `/` when `Accept` lists Markdown first. `qino build` writes the homepage's
// Markdown to `public/index.md`, which Next also serves at `/index.md`.
export function GET(request: Request) {
  return servePageMarkdown(request, () =>
    readFile(join(process.cwd(), "public/index.md"), "utf8"),
  );
}
