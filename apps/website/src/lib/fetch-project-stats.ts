import type { ProjectStats } from "@/types/project-stats";
import { getGithubStars } from "./get-github-stars";
import { getNpmDownloads } from "./get-npm-downloads";

type FetchProjectStatsOptions = {
  signal?: AbortSignal;
  githubToken?: string;
};

/** Never throws: a failed request yields `null` for that count. */
export async function fetchProjectStats({
  signal,
  githubToken,
}: FetchProjectStatsOptions = {}) {
  const [stars, downloads] = await Promise.allSettled([
    getGithubStars({ signal, token: githubToken }),
    getNpmDownloads(signal),
  ]);

  return {
    stars: stars.status == "fulfilled" ? stars.value : null,
    downloads: downloads.status == "fulfilled" ? downloads.value : null,
  } satisfies ProjectStats;
}
