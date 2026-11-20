import { expect, test } from "vitest";

import { titleFromDirectory } from "./title-from-directory";

test.each([
  ["posts", "Posts"],
  ["blog-posts", "Blog posts"],
  ["_team_members", "Team members"],
  ["en/posts", "Posts"],
  ["API", "API"],
])("titles %j as %j", (directory, title) => {
  expect(titleFromDirectory(directory)).toBe(title);
});
