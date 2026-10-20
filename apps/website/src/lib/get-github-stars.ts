type GithubRepo = {
  stargazers_count: number;
};

type GetGithubStarsOptions = {
  signal?: AbortSignal;
  /** Raises the rate limit from 60 to 5,000 requests an hour. Server only. */
  token?: string;
};

export async function getGithubStars({
  signal,
  token,
}: GetGithubStarsOptions = {}) {
  const response = await fetch(
    "https://api.github.com/repos/CharlyMartin/qino",
    { signal, headers: token ? { Authorization: `Bearer ${token}` } : {} },
  );
  if (!response.ok) throw new Error(`GitHub responded ${response.status}`);
  const repo: GithubRepo = await response.json();
  return repo.stargazers_count;
}
