import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";

import { PostMeta } from "./post-meta";

const _stats = {
  wordCount: 1200,
  proseCharacterCount: 7000,
  sourceCharacterCount: 7400,
};

test("shows the publish date and word count", () => {
  const html = renderToStaticMarkup(
    <PostMeta publishedOn="2026-10-07" _stats={_stats} />,
  );

  expect(html).toContain('<time dateTime="2026-10-07">Oct 7, 2026</time>');
  expect(html).toContain("1,200 words");
  expect(html).not.toContain("Updated");
});

test("shows the update date when there is one", () => {
  const html = renderToStaticMarkup(
    <PostMeta
      publishedOn="2026-10-07"
      updatedOn="2026-11-09"
      _stats={_stats}
    />,
  );

  expect(html).toContain(
    'Updated <time dateTime="2026-11-09">Nov 9, 2026</time>',
  );
});
