const SITE = "https://site.invalid";

/**
 * Whether a path resolves on the site it's served from. URLs read `//host`,
 * `/\host` and stray tabs or line feeds as another host, so the path is
 * resolved rather than matched.
 */
export function staysOnSite(path: string) {
  try {
    return new URL(path, SITE).origin == SITE;
  } catch {
    return false;
  }
}
