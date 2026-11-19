import { parse, postprocess, preprocess } from "micromark";
import { gfm } from "micromark-extension-gfm";
import { mdxjs } from "micromark-extension-mdxjs";
import type { Extension } from "micromark-util-types";

type TokenizeMarkdownBodyOptions = {
  /** Parses MDX, falling back to Markdown when it fails. */
  mdx: boolean;
};

/**
 * The micromark events of a Markdown body, with GFM. Their tokens carry exact
 * source offsets, which the syntax tree drops for parts such as a link's
 * destination.
 */
export function tokenizeMarkdownBody(
  body: string,
  { mdx }: TokenizeMarkdownBodyOptions,
) {
  const run = (extensions: Array<Extension>) =>
    postprocess(
      parse({ extensions })
        .document()
        .write(preprocess()(body, undefined, true)),
    );

  if (!mdx) return run([gfm()]);
  try {
    return run([gfm(), mdxjs()]);
  } catch {
    // Valid Markdown (such as HTML comments) is not always valid MDX.
    return run([gfm()]);
  }
}
