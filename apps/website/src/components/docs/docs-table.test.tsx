import { renderToStaticMarkup } from "react-dom/server";
import { expect, test } from "vitest";

import { DocsTable } from "./docs-table";

test("puts the table in a scroll area", () => {
  const html = renderToStaticMarkup(
    <DocsTable>
      <tbody>
        <tr>
          <td>getEntry</td>
        </tr>
      </tbody>
    </DocsTable>,
  );

  expect(html).toMatch(
    /data-slot="scroll-area".*data-slot="scroll-area-viewport".*<table><tbody><tr><td>getEntry<\/td><\/tr><\/tbody><\/table>/s,
  );
});
