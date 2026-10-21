import { expect, test } from "vitest";

import { getPageHead } from "./get-page-head";

const options = {
  title: "Installation | qino",
  description: "Add @qino/cms to a project.",
  path: "/docs/guide/installation",
};

test("sets an absolute canonical URL", () => {
  const { links } = getPageHead(options);
  expect(links).toEqual([
    {
      rel: "canonical",
      href: "https://www.qino.works/docs/guide/installation",
    },
  ]);
});

test("mirrors title and description into Open Graph and Twitter tags", () => {
  const { meta } = getPageHead({ ...options, type: "article" });
  expect(meta).toContainEqual({ property: "og:title", content: options.title });
  expect(meta).toContainEqual({ property: "og:type", content: "article" });
  expect(meta).toContainEqual({
    name: "twitter:description",
    content: options.description,
  });
});

test("renders each JSON-LD object as a script with the schema.org context", () => {
  const { scripts } = getPageHead({
    ...options,
    jsonLd: [{ "@type": "TechArticle", headline: "</script>" }],
  });
  expect(scripts).toEqual([
    {
      type: "application/ld+json",
      children:
        '{"@context":"https://schema.org","@type":"TechArticle","headline":"\\u003c/script>"}',
    },
  ]);
});
