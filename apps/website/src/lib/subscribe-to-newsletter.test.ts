import { beforeEach, expect, test, vi } from "vitest";

import { subscribeToNewsletter } from "./subscribe-to-newsletter";

const submit = vi.hoisted(() => vi.fn());

vi.mock("forminit", () => ({
  Forminit: class {
    submit = submit;
  },
}));

const initialState = { done: false };

function formData(name: string) {
  const fd = new FormData();
  fd.set("fi-sender-fullName", name);
  fd.set("fi-sender-email", "jane@example.com");
  return fd;
}

beforeEach(() => {
  submit.mockReset();
  vi.spyOn(console, "error").mockImplementation(() => {});
});

test("returns done when Forminit accepts the submission", async () => {
  submit.mockResolvedValue({ data: { hashId: "abc" }, error: null });
  await expect(
    subscribeToNewsletter(initialState, formData("Jane")),
  ).resolves.toEqual({ done: true, email: "jane@example.com" });
});

test("straightens curly apostrophes in the name", async () => {
  submit.mockResolvedValue({ data: { hashId: "abc" }, error: null });
  await subscribeToNewsletter(initialState, formData("Jane O’Neil"));
  const sent: FormData = submit.mock.calls[0][1];
  expect(sent.get("fi-sender-fullName")).toBe("Jane O'Neil");
});

test("returns field error text when Forminit rejects a field", async () => {
  submit.mockResolvedValue({
    data: null,
    error: { error: "VALIDATION", fieldName: "fi-sender-email", message: "" },
  });
  await expect(
    subscribeToNewsletter(initialState, formData("Jane")),
  ).resolves.toEqual({
    done: false,
    errorText: "Please enter a valid email address.",
  });
});

test("returns generic error text when the request throws", async () => {
  submit.mockRejectedValue(new Error("offline"));
  await expect(
    subscribeToNewsletter(initialState, formData("Jane")),
  ).resolves.toEqual({
    done: false,
    errorText: "Something went wrong. Please try again.",
  });
});
