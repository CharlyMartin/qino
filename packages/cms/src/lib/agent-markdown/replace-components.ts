import type {
  ComponentReplacement,
  MdxJsxElement,
  SourceRange,
} from "../../types/agent-markdown";
import { parseMarkdownBody } from "../../utils/markdown/parse-markdown-body";
import { absolutizeLinks } from "./absolutize-links";
import { dedentLines } from "./dedent-lines";
import { findJsxElements } from "./find-jsx-elements";
import { indentLines } from "./indent-lines";
import { rangeOf } from "./range-of";
import { readComponentProps } from "./read-component-props";

type ReplaceComponentsParams<Entry> = ComponentReplacement<Entry> & {
  /** An MDX body, with LF line endings. */
  body: string;
  /** The origin site-relative links in replacements resolve against. */
  origin: string;
};

// Blockquote markers, list markers and indentation, which a line can open
// with before a block.
const CONTAINER_PREFIX = /^(?:[ \t]*(?:>|[-+*][ \t]|\d{1,9}[.)][ \t]))*[ \t]*$/;

/**
 * Replaces each MDX component that has a function with what it returns,
 * inside out, so a function's `children` hold their own replacements. A
 * replacement gets LF line endings and absolute site-relative links, and is
 * spliced in by position, its lines kept in its component's list item or
 * blockquote. Everything else stays as written, a kept component's tags
 * included.
 */
export async function replaceComponents<Entry>({
  body,
  components = {},
  entry,
  origin,
}: ReplaceComponentsParams<Entry>) {
  const tree = parseMarkdownBody(body, { mdx: true });
  return renderRange({ start: 0, end: body.length }, findJsxElements(tree));

  // The body over `range`, with `elements`, which lie inside it, rendered.
  async function renderRange(
    range: SourceRange,
    elements: Array<MdxJsxElement>,
  ) {
    let result = "";
    let cursor = range.start;
    for (const element of elements) {
      const { start, end } = rangeOf(element);
      result += body.slice(cursor, start) + (await render(element));
      cursor = end;
    }
    return result + body.slice(cursor, range.end);
  }

  async function render(element: MdxJsxElement) {
    const range = rangeOf(element);
    const first = element.children[0];
    const last = element.children.at(-1);
    const inner =
      first && last
        ? { start: rangeOf(first).start, end: rangeOf(last).end }
        : undefined;
    const children = inner
      ? await renderRange(inner, findJsxElements(element))
      : "";

    const { name } = element;
    const component =
      name != null && Object.hasOwn(components, name)
        ? components[name]
        : undefined;
    const replacement = await component?.({
      props: readComponentProps(element.attributes),
      children: inner
        ? dedentLines(children, continuationPrefixAt(inner.start))
        : "",
      entry,
    });
    if (replacement != null) {
      const markdown = absolutizeLinks(replacement.replace(/\r\n?/g, "\n"), {
        origin,
        mdx: true,
      });
      return indentLines(markdown, continuationPrefixAt(range.start));
    }

    // Kept as written, with the components inside it replaced.
    return inner
      ? body.slice(range.start, inner.start) +
          children +
          body.slice(inner.end, range.end)
      : body.slice(range.start, range.end);
  }

  // What the lines after `offset`'s need before them to stay in its blocks:
  // its line's blockquote markers and indentation, with list markers turned
  // into spaces. Empty when text comes before `offset` on its line.
  function continuationPrefixAt(offset: number) {
    const prefix = body.slice(body.lastIndexOf("\n", offset - 1) + 1, offset);
    return CONTAINER_PREFIX.test(prefix) ? prefix.replace(/[^>\s]/g, " ") : "";
  }
}
