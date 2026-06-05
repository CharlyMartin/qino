import { createQino } from "qino";

export const { createCollection, createSingleton, createTree } = createQino({
  contentFolder: "src/content",
  mediaFolder: "public",
});
