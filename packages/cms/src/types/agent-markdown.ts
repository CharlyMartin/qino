/** Returns a page's agent Markdown, or `null` when the page doesn't exist. */
export type LoadAgentMarkdown = () => string | null | Promise<string | null>;
