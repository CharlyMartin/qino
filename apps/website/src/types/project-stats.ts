/** `null` when the count couldn't be fetched. */
export type StatCount = number | null;

export type ProjectStats = {
  stars: StatCount;
  downloads: StatCount;
};
