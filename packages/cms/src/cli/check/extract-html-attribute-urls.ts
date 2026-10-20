import { Parser } from "htmlparser2";

const MEDIA_ATTRIBUTES = new Set(["src", "poster"]);

type HtmlAttributeUrl = { url: string; lineOffset: number; image: boolean };

/**
 * Reads `src`/`poster` values from raw HTML with a spec tokenizer, so
 * comments are skipped and entities decode as browsers do in attributes.
 * `image` flags an `<img>`'s `src`.
 */
export function extractHtmlAttributeUrls(html: string) {
  const urls: Array<HtmlAttributeUrl> = [];
  let tag = "";

  const parser = new Parser(
    {
      onopentagname(name) {
        tag = name;
      },
      onattribute(name, value) {
        if (!MEDIA_ATTRIBUTES.has(name)) return;

        urls.push({
          url: value,
          lineOffset: html.slice(0, parser.startIndex).split("\n").length - 1,
          image: tag == "img" && name == "src",
        });
      },
    },
    { decodeEntities: true },
  );

  parser.end(html);

  return urls;
}
