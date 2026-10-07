import { expect, test } from "vitest";

import { formatPostDate } from "./format-post-date";

test("formats an ISO date as a medium US date", () => {
  expect(formatPostDate("2026-10-07")).toBe("Oct 7, 2026");
});

test("keeps the calendar day at year boundaries", () => {
  expect(formatPostDate("2026-01-01")).toBe("Jan 1, 2026");
  expect(formatPostDate("2025-12-31")).toBe("Dec 31, 2025");
});
