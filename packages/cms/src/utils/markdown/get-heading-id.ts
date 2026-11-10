import type { Heading } from "mdast";

/** The heading's `{#id}`, parsed by `remarkHeadingId`. */
export function getHeadingId(heading: Heading) {
  return heading.children.find((child) => child.type == "headingId")?.value;
}
