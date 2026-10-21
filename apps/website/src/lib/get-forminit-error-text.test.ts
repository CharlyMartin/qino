import { expect, test } from "vitest";

import { getForminitErrorText } from "./get-forminit-error-text";

const base = { success: false, error: "VALIDATION_ERROR", message: "" };

test("maps the field from fieldName", () => {
  expect(getForminitErrorText({ ...base, fieldName: "fi-sender-email" })).toBe(
    "Please enter a valid email address.",
  );
});

test("falls back to the first quoted word of the message", () => {
  expect(
    getForminitErrorText({
      ...base,
      message: '"fi-sender-fullName" contains invalid characters',
    }),
  ).toMatch(/letters, spaces/);
});

test("asks to wait when rate limited", () => {
  expect(getForminitErrorText({ ...base, error: "TOO_MANY_REQUESTS" })).toMatch(
    /wait/,
  );
});

test("uses a generic message otherwise", () => {
  expect(getForminitErrorText()).toBe(
    "Something went wrong. Please try again.",
  );
});
