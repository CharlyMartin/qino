import type { QinoConfig } from "../runtime/qino/init-qino";

export const DUMMY_INSTANCE_ID = Symbol.for("qino.tests.instance");

export const DUMMY_CONFIG: QinoConfig = {
  contentFolder: "src/content",
  media: { folder: "public" },
};

// Absolute so root-path tests don't depend on the working directory.
export const DUMMY_CONTENT_FOLDER = "/repo/apps/web/src/content";
