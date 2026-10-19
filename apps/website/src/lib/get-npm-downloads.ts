type NpmDownloads = {
  downloads: number;
};

export async function getNpmDownloads(signal?: AbortSignal) {
  const response = await fetch(
    "https://api.npmjs.org/downloads/point/last-month/@qino/cms",
    { signal },
  );
  if (!response.ok) throw new Error(`npm responded ${response.status}`);
  const point: NpmDownloads = await response.json();
  return point.downloads;
}
