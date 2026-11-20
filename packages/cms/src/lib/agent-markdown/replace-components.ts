import type { Nodes } from "mdast";

import type {
  AgentMarkdownComponent,
  MdxJsxElement,
} from "../../types/agent-markdown";
import { parseMarkdownBody } from "../../utils/markdown/parse-markdown-body";
import { dedentLines } from "./dedent-lines";
import { findJsxElements } from "./find-jsx-elements";
import { indentLines } from "./indent-lines";
import { readComponentProps } from "./read-component-props";

type ReplaceComponentsParams<Entry> = {
  /** An MDX body. */
  body: string;
  components: Readonly<Record<string, AgentMarkdownComponent<Entry>>>;
  /** The entry the body belongs to, passed to every function. */
  entry: Entry;
};

/**
 * Replaces each MDX component that has a function with what it returns,
 * inside out, so a function's `children` hold their own replacements. Each
 * replacement is spliced in by position, indented to its component's column,
 * and everything else stays as written, a kept component's tags included.
 */
export async function replaceComponents<Entry>({
  body,
  components,
  entry,
}: ReplaceComponentsParams<Entry>) {
  const tree = parseMarkdownBody(body, { mdx: true, headingIds: true });
  return renderRange(0, body.length, findJsxElements(tree));

  // The body from `start` to `end`, with `elements`, which lie inside it, rendered.
  async function renderRange(
    start: number,
    end: number,
    elements: Array<MdxJsxElement>,
  ) {
    let result = "";
    let cursor = start;
    for (const element of elements) {
      const [elementStart, elementEnd] = offsetsOf(element);
      result += body.slice(cursor, elementStart) + (await render(element));
      cursor = elementEnd;
    }
    return result + body.slice(cursor, end);
  }

  async function render(element: MdxJsxElement) {
    const [start, end] = offsetsOf(element);
    const first = element.children[0];
    const last = element.children.at(-1);
    const [innerStart] = first ? offsetsOf(first) : [start];
    const [, innerEnd] = last ? offsetsOf(last) : [start, start];
    const inner = first
      ? await renderRange(innerStart, innerEnd, findJsxElements(element))
      : "";

    const { name } = element;
    const replace =
      name != null && Object.hasOwn(components, name)
        ? components[name]
        : undefined;
    const replacement = await replace?.({
      props: readComponentProps(element.attributes),
      children: dedentLines(inner, indentAt(innerStart)),
      entry,
    });
    if (replacement != null) return indentLines(replacement, indentAt(start));

    // Kept as written, with the components inside it replaced.
    return first
      ? body.slice(start, innerStart) + inner + body.slice(innerEnd, end)
      : body.slice(start, end);
  }

  // The spaces and tabs before `offset` on its line, when nothing else is.
  function indentAt(offset: number) {
    const prefix = body.slice(body.lastIndexOf("\n", offset - 1) + 1, offset);
    return /^[ \t]*$/.test(prefix) ? prefix : "";
  }

  function offsetsOf(node: Nodes) {
    return [
      node.position?.start.offset ?? 0,
      node.position?.end.offset ?? 0,
    ] as const;
  }
}
