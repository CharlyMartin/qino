import { site } from "./site";

// The 404 body for agents that asked for Markdown: what went wrong and where to look instead.
// Each link is a file, so it answers whatever the Accept header.
export function buildNotFoundMarkdown(pathname: string) {
  return [
    "# Page not found",
    `There is no page at \`${pathname}\` on ${site.url}.`,
    [
      `- [llms.txt](${site.url}/llms.txt): Every documentation page, as Markdown links`,
      `- [llms-full.txt](${site.url}/llms-full.txt): The full documentation in one file`,
      `- [Sitemap](${site.url}/sitemap.xml): Every page on the site`,
    ].join("\n"),
  ]
    .join("\n\n")
    .concat("\n");
}
