type NpmDownloads = {
  downloads: number;
};

const day = 24 * 60 * 60 * 1000;

export async function getNpmDownloads(signal?: AbortSignal) {
  // An explicit range, because npm's `last-month` alias stopped moving in July 2026.
  const [start, end] = [Date.now() - 30 * day, Date.now() - day].map((time) =>
    new Date(time).toISOString().slice(0, 10),
  );
  const response = await fetch(
    `https://api.npmjs.org/downloads/point/${start}:${end}/@qino/cms`,
    { signal },
  );
  if (!response.ok) throw new Error(`npm responded ${response.status}`);
  const point: NpmDownloads = await response.json();
  return point.downloads;
}
