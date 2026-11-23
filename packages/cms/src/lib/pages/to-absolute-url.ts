/**
 * A site path, such as a page's or its Markdown URL's, as an absolute URL on
 * `origin`. The path is joined to the origin before parsing, so no path
 * starting with `/`, such as `//host`, can point it at another host.
 */
export function toAbsoluteUrl(path: string, origin: string) {
  return new URL(`${origin}${path}`).href;
}
