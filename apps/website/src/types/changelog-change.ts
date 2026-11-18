import type { ChangelogPullRequest } from "./changelog-pull-request";

export type ChangelogChange = {
  /** The first sentence of the change's description, as inline Markdown. */
  summary: string;
  pullRequest?: ChangelogPullRequest;
};
