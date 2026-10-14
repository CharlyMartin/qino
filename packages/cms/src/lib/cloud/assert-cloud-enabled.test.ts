import { describe, expect, test } from "vitest";

import type { QinoContext } from "../../runtime/qino/init-qino";
import { assertCloudEnabled } from "./assert-cloud-enabled";

const base: QinoContext = {
  instanceId: Symbol("test"),
  contentFolder: "content",
  mediaFolder: "public",
};
const withCloud: QinoContext = {
  ...base,
  cloud: {
    publish: { mode: "commit_to_default_branch", reviewBeforePublish: false },
  },
};

describe("assertCloudEnabled", () => {
  test("passes without a primitive cloud config", () => {
    expect(() => assertCloudEnabled(base, undefined, "posts")).not.toThrow();
  });

  test("passes when initQino sets cloud", () => {
    expect(() => assertCloudEnabled(withCloud, {}, "posts")).not.toThrow();
  });

  test("throws when only the primitive sets cloud", () => {
    expect(() => assertCloudEnabled(base, {}, "posts")).toThrow(
      '"posts" sets `cloud`, but initQino doesn\'t. Add `cloud` to initQino.',
    );
  });
});
