import { Parser } from "htmlparser2";

const MEDIA_ATTRIBUTES = new Set(["src", "poster"]);

/**
 * Reads `src`/`poster` values from raw HTML with a spec tokenizer, so
 * comments are skipped and entities decode as browsers do in attributes.
 */
export function extractHtmlAttributeUrls(html: string) {
  const urls: Array<{ url: string; lineOffset: number }> = [];

  const parser = new Parser(
    {
      onattribute(name, value) {
        if (!MEDIA_ATTRIBUTES.has(name)) return;

        urls.push({
          url: value,
          lineOffset: html.slice(0, parser.startIndex).split("\n").length - 1,
        });
      },
    },
    { decodeEntities: true },
  );

  parser.end(html);

  return urls;
}
