/** Checks that `siteUrl` is an http(s) origin, with nothing after the host but an optional `/`. */
export function assertSiteUrl(siteUrl: string | undefined) {
  if (siteUrl == null) return;

  let url: URL | undefined;
  try {
    url = new URL(siteUrl);
  } catch {
    // Not a URL: reported below.
  }
  const isOrigin =
    url != null &&
    (url.protocol == "https:" || url.protocol == "http:") &&
    url.pathname == "/" &&
    !url.search &&
    !url.hash &&
    !url.username;
  if (!isOrigin) {
    throw new Error(
      `siteUrl "${siteUrl}" must be an http(s) origin, such as "https://example.com".`,
    );
  }
}
