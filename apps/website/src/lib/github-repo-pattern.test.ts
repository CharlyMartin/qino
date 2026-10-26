import { expect, test } from "vitest";

import { githubRepoPattern } from "./github-repo-pattern";

// How browsers apply `pattern`: anchored, with the `v` flag.
const regex = new RegExp(`^(?:${githubRepoPattern})$`, "v");

test.each([
  "acme/website",
  "acme-inc/my.site_v2",
  "github.com/acme/website",
  "https://github.com/acme/website",
  "https://www.github.com/acme/website/",
])("accepts %s", (value) => {
  expect(regex.test(value)).toBe(true);
});

test.each([
  "acme",
  "acme/website/tree/main",
  "https://gitlab.com/acme/website",
  "acme website",
  "",
])("rejects %j", (value) => {
  expect(regex.test(value)).toBe(false);
});
