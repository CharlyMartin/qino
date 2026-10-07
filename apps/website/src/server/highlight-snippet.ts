import hljs from "highlight.js";

const FENCE = /^```(\w+)[^\n]*\n([\s\S]*?)\n```/m;

// Highlights the single fenced block of a snippet with the same highlight.js
// classes `rehype-highlight` emits in the docs, so the github-dark theme applies.
export function highlightSnippet(markdown: string) {
  const [, language, code] = markdown.match(FENCE) ?? [];
  if (!language || code == null) {
    throw new Error("Snippet needs a fenced code block with a language.");
  }

  return hljs.highlight(code, { language }).value;
}
