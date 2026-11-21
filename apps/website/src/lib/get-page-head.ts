import { site } from "./site";
import { type JsonLd, toJsonLdScript } from "./to-json-ld-script";

type PageHeadOptions = {
  title: string;
  description: string;
  path: string;
  /** The page's Markdown URL, from qino, advertised as an alternate. */
  markdownUrl?: string;
  type?: "website" | "article";
  jsonLd?: Array<JsonLd>;
};

// Per-page tags; site-wide ones (og:image, og:site_name…) live on the root route.
export function getPageHead({
  title,
  description,
  path,
  markdownUrl,
  type = "website",
  jsonLd = [],
}: PageHeadOptions) {
  const url = new URL(path, site.url).href;

  return {
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:url", content: url },
      { property: "og:type", content: type },
      { name: "twitter:title", content: title },
      { name: "twitter:description", content: description },
    ],
    links: [
      { rel: "canonical", href: url },
      ...(markdownUrl
        ? [{ rel: "alternate", type: "text/markdown", href: markdownUrl }]
        : []),
    ],
    scripts: jsonLd.map((data) => toJsonLdScript(data)),
  };
}
