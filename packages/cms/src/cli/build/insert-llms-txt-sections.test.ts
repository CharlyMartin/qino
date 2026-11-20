import { describe, expect, test } from "vitest";

import { insertLlmsTxtSections } from "./insert-llms-txt-sections";

const sections = "## Docs\n\n- [Guide](https://example.com/guide.md)";

describe("insertLlmsTxtSections", () => {
  test("inserts the sections before ## Optional", () => {
    expect(
      insertLlmsTxtSections({
        template:
          "# Site\n\n> Summary.\n\n## Optional\n\n- [GitHub](https://github.com)\n",
        sections,
      }),
    ).toBe(
      "# Site\n\n> Summary.\n\n## Docs\n\n- [Guide](https://example.com/guide.md)\n\n## Optional\n\n- [GitHub](https://github.com)\n",
    );
  });

  test.each(["## Optional {#optional}", "## *Optional*"])(
    "reads %j as ## Optional",
    (heading) => {
      expect(
        insertLlmsTxtSections({ template: `# Site\n\n${heading}\n`, sections }),
      ).toBe(`# Site\n\n${sections}\n\n${heading}\n`);
    },
  );

  test("appends them when there's no ## Optional heading, past code and deeper headings", () => {
    expect(
      insertLlmsTxtSections({
        template: "# Site\n\n```md\n## Optional\n```\n\n### Optional\n",
        sections,
      }),
    ).toBe(
      "# Site\n\n```md\n## Optional\n```\n\n### Optional\n\n## Docs\n\n- [Guide](https://example.com/guide.md)\n",
    );
  });

  test("drops frontmatter and leading blank lines, with LF line endings and one trailing newline", () => {
    expect(
      insertLlmsTxtSections({
        template: "---\r\nnote: internal\r\n---\r\n\r\n\r\n# Site\r\n\r\n\r\n",
        sections: "",
      }),
    ).toBe("# Site\n");
  });
});
