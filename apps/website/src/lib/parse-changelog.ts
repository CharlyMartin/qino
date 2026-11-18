import { getFirstSentence } from "./get-first-sentence";
import { isWebUrl } from "./is-web-url";

// A change, as Changesets writes it with `@changesets/changelog-github`:
// "[#331](…) [`286c27e`](…) Thanks [@name](…)! - Caches parsed files…".
const changePattern = /^(.*?\)!?) - (.*)$/;
const pullRequestPattern = /\[#(\d+)\]\(([^)\s]+)\)/;

/**
 * Reads a Changesets changelog into its releases, newest first, keeping each
 * change's first sentence. Bullets without links, such as "Updated
 * dependencies", are left out, and so are the releases they leave empty.
 */
export function parseChangelog(markdown: string) {
  return markdown
    .split(/^## /m)
    .slice(1)
    .map((section) => {
      const version = section.slice(0, section.indexOf("\n")).trim();
      const changes = section
        .split(/^- /m)
        .slice(1)
        .flatMap((bullet) => {
          // The bullet's first paragraph, its wrapped lines joined back up.
          const paragraph = bullet
            .split(/\n\s*\n/)[0]
            .replace(/\s*\n\s*/g, " ");
          const change = changePattern.exec(paragraph);
          if (!change) return [];

          const [, links, description] = change;
          const pullRequest = pullRequestPattern.exec(links);
          // A PR link that isn't a web URL, say one edited by hand, is dropped.
          return [
            {
              summary: getFirstSentence(description),
              pullRequest:
                pullRequest && isWebUrl(pullRequest[2])
                  ? { number: Number(pullRequest[1]), url: pullRequest[2] }
                  : undefined,
            },
          ];
        });

      return { version, changes };
    })
    .filter((release) => release.changes.length > 0);
}
