/**
 * A page's URL on `origin`. The path is joined to the origin before parsing,
 * so no path starting with `/`, such as `//host`, can point it at another
 * host.
 */
export function toPageUrl(path: string, origin: string) {
  return new URL(`${origin}${path}`).href;
}
