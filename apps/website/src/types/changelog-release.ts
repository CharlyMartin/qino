import type { ChangelogChange } from "./changelog-change";

export type ChangelogRelease = {
  version: string;
  changes: Array<ChangelogChange>;
};
