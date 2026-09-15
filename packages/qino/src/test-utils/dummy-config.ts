import type { QinoConfig } from "../runtime/qino/create-qino";

export const DUMMY_INSTANCE_ID = Symbol.for("qino.tests.instance");

export const DUMMY_CONFIG: QinoConfig = {
  contentFolder: "src/content",
  mediaFolder: "public",
};
