import { expect, test } from "vitest";

import changelog from "../../../../packages/cms/CHANGELOG.md?raw";
import { parseChangelog } from "./parse-changelog";

const fixture = `# @qino/cms

## 0.23.0

### Minor Changes

- [#331](https://github.com/CharlyMartin/qino/pull/331) [\`286c27e\`](https://github.com/CharlyMartin/qino/commit/286c27e) Thanks [@Markdown2049](https://github.com/Markdown2049)! - Caches parsed files for trees and items. A file is parsed again once it changes.

  - \`getTree\` shares each file's cached parse.

- [#329](https://github.com/CharlyMartin/qino/pull/329) [\`64672a8\`](https://github.com/CharlyMartin/qino/commit/64672a8) Thanks [@Markdown2049](https://github.com/Markdown2049)! - Adds \`getPaginatedEntries\` to collections:

  \`\`\`ts
  const page = await posts.getPaginatedEntries(2);
  \`\`\`

### Patch Changes

- [\`2656e10\`](https://github.com/CharlyMartin/qino/commit/2656e10) - Shares work between calls
  that run at the same time.

## 0.22.1

### Patch Changes

- [#330](/pull/330) - Fixes a relative pull request link.

- Updated dependencies [[\`abc1234\`](https://github.com/CharlyMartin/qino/commit/abc1234)]:
  - @qino/tooling@0.9.0

## 0.22.0

### Patch Changes

- Updated dependencies [[\`def5678\`](https://github.com/CharlyMartin/qino/commit/def5678)]:
  - @qino/tooling@0.8.1
`;

test("reads each change's first sentence and pull request, newest first", () => {
  expect(parseChangelog(fixture)).toEqual([
    {
      version: "0.23.0",
      changes: [
        {
          summary: "Caches parsed files for trees and items.",
          pullRequest: {
            number: 331,
            url: "https://github.com/CharlyMartin/qino/pull/331",
          },
        },
        {
          summary: "Adds `getPaginatedEntries` to collections.",
          pullRequest: {
            number: 329,
            url: "https://github.com/CharlyMartin/qino/pull/329",
          },
        },
        {
          summary: "Shares work between calls that run at the same time.",
          pullRequest: undefined,
        },
      ],
    },
    {
      version: "0.22.1",
      changes: [
        {
          summary: "Fixes a relative pull request link.",
          pullRequest: undefined,
        },
      ],
    },
  ]);
});

test("reads every pull request of the @qino/cms changelog", () => {
  const changes = parseChangelog(changelog).flatMap(
    (release) => release.changes,
  );
  // Releases with only "Updated dependencies" and changes without a pull
  // request are left out or kept unlinked, so count the linked ones.
  const linkedBullets = changelog.match(/^- \[#\d+\]/gm) ?? [];

  expect(changes.filter((change) => change.pullRequest)).toHaveLength(
    linkedBullets.length,
  );
  for (const change of changes) {
    expect(change.summary).not.toBe("");
    expect(change.summary).not.toMatch(/\n| - |Thanks \[/);
  }
});
