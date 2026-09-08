export { assertDirectory } from "./assert-directory";
export { assertFile } from "./assert-file";
export { isDirectory } from "./is-directory";
export { isFile } from "./is-file";

import { stats } from "./markdown";

export { removeLeadingSlash } from "./remove-leading-slash";

export const markdown = { stats } as const;
export type { MarkdownStats } from "./markdown";
