import { expect, test } from "vitest";

import { getFormcarryErrorText } from "./get-formcarry-error-text";

test("asks to wait when rate limited", () => {
  expect(getFormcarryErrorText({ code: 429 })).toBe(
    "Please wait a few seconds and try again.",
  );
});

test("names the email field when it fails validation", () => {
  expect(
    getFormcarryErrorText({
      code: 422,
      errors: { email: { message: "Invalid email" } },
    }),
  ).toBe("Please enter a valid email address.");
});

test("falls back to generic text", () => {
  expect(getFormcarryErrorText({ code: 401 })).toBe(
    "Something went wrong. Please try again.",
  );
  expect(getFormcarryErrorText()).toBe(
    "Something went wrong. Please try again.",
  );
});
