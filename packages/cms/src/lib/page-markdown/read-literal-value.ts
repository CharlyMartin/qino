import type { Node } from "estree";

import type { PageMarkdownPropValue } from "../../types/page-markdown";

/**
 * The value of an MDX attribute expression that is a literal, or a JSON-like
 * array or object of literals, read from its syntax tree without running it.
 * `undefined` for any other expression.
 */
export function readLiteralValue(
  node: Node,
): PageMarkdownPropValue | undefined {
  switch (node.type) {
    case "Literal": {
      const { value } = node;
      // Regular expressions and bigints aren't JSON.
      return value == null ||
        typeof value == "string" ||
        typeof value == "number" ||
        typeof value == "boolean"
        ? value
        : undefined;
    }
    case "TemplateLiteral":
      return node.expressions.length == 0
        ? (node.quasis[0]?.value.cooked ?? undefined)
        : undefined;
    case "UnaryExpression":
      return node.operator == "-" &&
        node.argument.type == "Literal" &&
        typeof node.argument.value == "number"
        ? -node.argument.value
        : undefined;
    case "ArrayExpression": {
      const values = [];
      for (const element of node.elements) {
        // A hole, as in `[1, , 2]`, isn't JSON.
        if (!element) return undefined;
        const value = readLiteralValue(element);
        // `null` is a value: only `undefined` means it isn't a literal.
        if (value === undefined) return undefined;
        values.push(value);
      }
      return values;
    }
    case "ObjectExpression": {
      const entries = [];
      for (const property of node.properties) {
        if (
          property.type != "Property" ||
          property.kind != "init" ||
          property.computed ||
          property.method ||
          property.shorthand
        ) {
          return undefined;
        }
        const { key } = property;
        const name =
          key.type == "Identifier"
            ? key.name
            : key.type == "Literal" && typeof key.value == "string"
              ? key.value
              : undefined;
        const value = readLiteralValue(property.value);
        if (name == undefined || value === undefined) return undefined;
        entries.push([name, value] as const);
      }
      // Own properties, even for a key such as `__proto__`.
      return Object.fromEntries(entries);
    }
    default:
      return undefined;
  }
}
