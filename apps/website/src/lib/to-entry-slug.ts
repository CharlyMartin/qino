// The slug a route param names: without the trailing slash the prerender
// crawler adds, nor the `.md` of a Markdown URL.
export function toEntrySlug(param: string) {
  return param.replace(/\/$/, "").replace(/\.md$/, "");
}
