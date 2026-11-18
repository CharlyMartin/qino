export type InlineSegment =
  | { type: "text" | "code" | "strong"; text: string }
  | { type: "link"; text: string; href: string };
