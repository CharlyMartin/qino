import type { Root } from "mdast";

import { getFootnoteDefinitions } from "./get-footnote-definitions";
import { getFootnoteReferences } from "./get-footnote-references";

/**
 * The footnotes `remark-rehype` renders, in its order: by first reference,
 * then those only referenced from other footnotes. Unused ones are dropped.
 */
export function getRenderedFootnotes(tree: Root) {
  // Reversed, so the first definition of an id wins, as in remark-rehype.
  const definitions = new Map(
    getFootnoteDefinitions(tree)
      .toReversed()
      .map((definition) => [definition.identifier.toUpperCase(), definition]),
  );
  const order = [...new Set(getFootnoteReferences(tree))];

  for (const id of order) {
    const nested = definitions.get(id)?.children ?? [];
    for (const reference of nested.flatMap(getFootnoteReferences)) {
      if (!order.includes(reference)) order.push(reference);
    }
  }

  return order.flatMap((id) => {
    const definition = definitions.get(id);
    return definition ? [{ id, definition }] : [];
  });
}
