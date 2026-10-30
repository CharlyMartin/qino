/** First paragraph of a Markdown body, skipping headings, imports, and JSX. */
export function getExcerpt(markdown: string) {
  const paragraph = markdown
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .find((block) => block && !/^(#|import |export |<|```)/.test(block));

  return paragraph?.replace(/\s+/g, " ") ?? "";
}
