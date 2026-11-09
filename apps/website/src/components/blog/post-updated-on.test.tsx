import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";

import { PostUpdatedOn } from "./post-updated-on";

test("shows the update date", () => {
  const html = renderToStaticMarkup(<PostUpdatedOn updatedOn="2026-11-09" />);

  expect(html).toContain(
    'Last updated <time dateTime="2026-11-09">Nov 9, 2026</time>',
  );
});
