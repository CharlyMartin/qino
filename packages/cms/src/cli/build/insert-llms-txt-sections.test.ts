import { describe, expect, test } from "vitest";

import { insertLlmsTxtSections } from "./insert-llms-txt-sections";

const sections = "## Docs\n\n- [Guide](https://example.com/guide.md)";

describe("insertLlmsTxtSections", () => {
  test("inserts the sections before ## Optional", () => {
    expect(
      insertLlmsTxtSections(
        "# Site\n\n> Summary.\n\n## Optional\n\n- [GitHub](https://github.com)\n",
        sections,
      ),
    ).toBe(
      "# Site\n\n> Summary.\n\n## Docs\n\n- [Guide](https://example.com/guide.md)\n\n## Optional\n\n- [GitHub](https://github.com)\n",
    );
  });

  test("appends them when there's no ## Optional heading, past code and deeper headings", () => {
    expect(
      insertLlmsTxtSections(
        "# Site\n\n```md\n## Optional\n```\n\n### Optional\n",
        sections,
      ),
    ).toBe(
      "# Site\n\n```md\n## Optional\n```\n\n### Optional\n\n## Docs\n\n- [Guide](https://example.com/guide.md)\n",
    );
  });

  test("gives LF line endings and one trailing newline", () => {
    expect(insertLlmsTxtSections("# Site\r\n\r\n\r\n", "")).toBe("# Site\n");
  });
});
