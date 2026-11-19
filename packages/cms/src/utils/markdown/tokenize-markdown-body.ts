import { parse, postprocess, preprocess } from "micromark";
import { gfm } from "micromark-extension-gfm";
import { mdxjs } from "micromark-extension-mdxjs";
import type { Extension } from "micromark-util-types";

import { micromarkHeadingId } from "./micromark-heading-id";

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
    // After `mdxjs`, so `{#id}` is tried before an MDX expression, as in
    // `parseMarkdownBody`.
    return run([gfm(), mdxjs(), micromarkHeadingId()]);
  } catch {
    // Valid Markdown (such as HTML comments) is not always valid MDX.
    return run([gfm()]);
  }
}
