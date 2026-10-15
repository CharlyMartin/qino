import { describe, expect, test } from "vitest";

import { serializeCloudConfig } from "./serialize-cloud-config";

const accepted = [{ type: "image/*", maxSize: "5MB" }] as const;

describe("serializeCloudConfig", () => {
  test("defaults branchPrefix and review settings", () => {
    expect(
      serializeCloudConfig({
        publish: { mode: "open_pull_request", reviewBeforePublish: true },
      }),
    ).toEqual({
      publish: {
        mode: "open_pull_request",
        reviewBeforePublish: { bypassIfAdmin: false },
        branchPrefix: "qino/",
      },
    });
  });

  test("keeps a custom branchPrefix", () => {
    expect(
      serializeCloudConfig({
        publish: {
          mode: "open_pull_request",
          reviewBeforePublish: false,
          branchPrefix: "content/",
        },
      }).publish,
    ).toMatchObject({ branchPrefix: "content/" });
  });

  test("has no branchPrefix for direct commits", () => {
    expect(
      serializeCloudConfig({
        publish: {
          mode: "commit_to_default_branch",
          reviewBeforePublish: false,
        },
      }),
    ).toEqual({
      publish: {
        mode: "commit_to_default_branch",
        reviewBeforePublish: false,
      },
    });
  });

  test("keeps review settings", () => {
    expect(
      serializeCloudConfig({
        publish: {
          mode: "commit_to_default_branch",
          reviewBeforePublish: { bypassIfAdmin: true },
        },
      }).publish,
    ).toEqual({
      mode: "commit_to_default_branch",
      reviewBeforePublish: { bypassIfAdmin: true },
    });
  });

  test("fills in an empty review object", () => {
    expect(
      serializeCloudConfig({
        publish: { mode: "open_pull_request", reviewBeforePublish: {} },
      }).publish,
    ).toMatchObject({ reviewBeforePublish: { bypassIfAdmin: false } });
  });

  test("writes accepted media when set", () => {
    expect(
      serializeCloudConfig({
        publish: {
          mode: "commit_to_default_branch",
          reviewBeforePublish: false,
        },
        media: { accepted },
      }).media,
    ).toEqual({ accepted: [{ type: "image/*", maxSize: 5242880 }] });
  });

  test("leaves media out when accepted is unset", () => {
    expect(
      serializeCloudConfig({
        publish: {
          mode: "commit_to_default_branch",
          reviewBeforePublish: false,
        },
        media: {},
      }),
    ).not.toHaveProperty("media");
  });

  test("validates accepted media", () => {
    expect(() =>
      serializeCloudConfig({
        publish: {
          mode: "commit_to_default_branch",
          reviewBeforePublish: false,
        },
        media: { accepted: [{ type: "png", maxSize: "50KB" }] },
      }),
    ).toThrow('media.accepted type "png" of initQino isn\'t a MIME type');
  });
});
