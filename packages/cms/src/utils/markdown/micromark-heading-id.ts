import type { Code, Extension } from "micromark-util-types";

declare module "micromark-util-types" {
  interface TokenTypeMap {
    qinoHeadingId: "qinoHeadingId";
    qinoHeadingIdMarker: "qinoHeadingIdMarker";
    qinoHeadingIdString: "qinoHeadingIdString";
  }
}

const backslash = 92;
const numberSign = 35;
const leftCurlyBrace = 123;
const rightCurlyBrace = 125;

/**
 * Tokenizes `{#id}`, the syntax of `remark-custom-heading-id`. Added after
 * `remark-mdx`, it runs before MDX expressions, so `{#id}` isn't one.
 */
export function micromarkHeadingId() {
  const extension: Extension = {
    text: {
      [leftCurlyBrace]: {
        name: "qinoHeadingId",
        tokenize(effects, ok, nok) {
          // Line endings are negative, below the tab and virtual space codes.
          const isIdEnd = (code: Code) =>
            code == null ||
            code < -2 ||
            code == backslash ||
            code == leftCurlyBrace;

          return start;

          function start(code: Code) {
            effects.enter("qinoHeadingId");
            effects.enter("qinoHeadingIdMarker");
            effects.consume(code);
            return afterBrace;
          }

          function afterBrace(code: Code) {
            if (code != numberSign) return nok(code);
            effects.consume(code);
            effects.exit("qinoHeadingIdMarker");
            return idStart;
          }

          function idStart(code: Code) {
            if (code == rightCurlyBrace || isIdEnd(code)) return nok(code);
            effects.enter("qinoHeadingIdString");
            // String content, so character references like `&amp;` decode.
            effects.enter("chunkString", { contentType: "string" });
            effects.consume(code);
            return insideId;
          }

          function insideId(code: Code) {
            if (isIdEnd(code)) return nok(code);
            if (code != rightCurlyBrace) {
              effects.consume(code);
              return insideId;
            }

            effects.exit("chunkString");
            effects.exit("qinoHeadingIdString");
            effects.enter("qinoHeadingIdMarker");
            effects.consume(code);
            effects.exit("qinoHeadingIdMarker");
            effects.exit("qinoHeadingId");
            return ok;
          }
        },
      },
    },
  };

  return extension;
}
