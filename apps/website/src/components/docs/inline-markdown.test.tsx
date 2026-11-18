import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";

import { InlineMarkdown } from "./inline-markdown";

test("renders code spans inside bold text and link labels", () => {
  const html = renderToStaticMarkup(
    <InlineMarkdown markdown="**`getEntries` pages** with [`view`](https://x.dev)." />,
  );

  expect(html).not.toContain("`");
  expect(html).toMatch(
    /<strong[^>]*><code[^>]*>getEntries<\/code> pages<\/strong>/,
  );
  expect(html).toMatch(
    /<a href="https:\/\/x\.dev\/\?utm_source=qino"[^>]*><code[^>]*>view<\/code><\/a>/,
  );
});
