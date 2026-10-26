import { beforeEach, expect, test, vi } from "vitest";

import { requestMigration } from "./request-migration";

const fetchMock = vi.fn();

const initialState = { done: false };

function formData() {
  const fd = new FormData();
  fd.set("name", "Jane");
  fd.set("email", "jane@example.com");
  fd.set("repository", "acme/site");
  return fd;
}

function respond(body: Record<string, unknown>) {
  fetchMock.mockResolvedValue({ json: async () => body });
}

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  vi.spyOn(console, "error").mockImplementation(() => {});
});

test("returns done when formcarry stores the submission", async () => {
  respond({ code: 200, status: "success" });
  await expect(requestMigration(initialState, formData())).resolves.toEqual({
    done: true,
    email: "jane@example.com",
  });
});

test("posts the form data and asks for JSON", async () => {
  respond({ code: 200, status: "success" });
  const fd = formData();
  await requestMigration(initialState, fd);
  const [url, init] = fetchMock.mock.calls[0];
  expect(url).toBe("https://formcarry.com/s/GpSopgXeih4");
  expect(init).toMatchObject({
    method: "POST",
    headers: { Accept: "application/json" },
    body: fd,
  });
});

test("returns error text when formcarry rejects the submission", async () => {
  respond({ code: 422, errors: { email: { message: "Invalid" } } });
  await expect(requestMigration(initialState, formData())).resolves.toEqual({
    done: false,
    errorText: "Please enter a valid email address.",
  });
});

test("returns generic error text when the request throws", async () => {
  fetchMock.mockRejectedValue(new Error("offline"));
  await expect(requestMigration(initialState, formData())).resolves.toEqual({
    done: false,
    errorText: "Something went wrong. Please try again.",
  });
});
