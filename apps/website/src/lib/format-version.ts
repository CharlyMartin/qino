/** Drops a zero patch: `0.13.0` → `0.13`, `0.13.1` stays. */
export function formatVersion(version: string) {
  const [major, minor, patch] = version.split(".");
  return patch == "0" ? `${major}.${minor}` : `${major}.${minor}.${patch}`;
}
