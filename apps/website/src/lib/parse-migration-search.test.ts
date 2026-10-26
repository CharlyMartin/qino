import { expect, test } from "vitest";

import { parseMigrationSearch } from "./parse-migration-search";

test("keeps a valid repo", () => {
  expect(parseMigrationSearch({ repo: "acme/site" })).toEqual({
    repo: "acme/site",
  });
});

test("returns nothing when no params are passed", () => {
  expect(parseMigrationSearch({})).toEqual({});
});

test("drops a repo that isn't owner/name", () => {
  expect(parseMigrationSearch({ repo: "Pay us now" })).toEqual({
    repo: undefined,
  });
});

test("drops non-string values", () => {
  expect(parseMigrationSearch({ repo: 42 })).toEqual({ repo: undefined });
});

test("ignores other params", () => {
  expect(parseMigrationSearch({ repo: "acme/site", link: "x" })).toEqual({
    repo: "acme/site",
  });
});
