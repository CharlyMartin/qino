import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";

import { PostMeta } from "./post-meta";

test("shows the publish date and word count", () => {
  const html = renderToStaticMarkup(
    <PostMeta
      publishedOn="2026-10-07"
      _stats={{
        wordCount: 1200,
        proseCharacterCount: 7000,
        sourceCharacterCount: 7400,
      }}
    />,
  );

  expect(html).toContain('<time dateTime="2026-10-07">Oct 7, 2026</time>');
  expect(html).toContain("1,200 words");
});
