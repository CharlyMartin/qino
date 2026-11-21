import type { MdxJsxElement } from "../../types/agent-markdown";
import { readLiteralValue } from "./read-literal-value";

/**
 * An MDX component's literal attributes, by name. A bare attribute is `true`.
 * Spreads and attributes set by other expressions are left out.
 */
export function readComponentProps(attributes: MdxJsxElement["attributes"]) {
  const entries = [];
  for (const attribute of attributes) {
    if (attribute.type != "mdxJsxAttribute") continue;

    const { name, value } = attribute;
    if (value == null || typeof value == "string") {
      entries.push([name, value ?? true] as const);
      continue;
    }
    const [statement, ...rest] = value.data?.estree?.body ?? [];
    if (statement?.type != "ExpressionStatement" || rest.length > 0) continue;
    const literal = readLiteralValue(statement.expression);
    if (literal !== undefined) entries.push([name, literal] as const);
  }
  // Own properties, even for an attribute such as `__proto__`.
  return Object.fromEntries(entries);
}
