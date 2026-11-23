type RequirePagesOptions = {
  /** Names the primitive in the message, such as `Collection "posts"`. */
  owner: string;
  /** The option the primitive declares its pages with. */
  option: "pages" | "page";
};

const MISSING = {
  pages: "has no pages: declare them to get page Markdown and Markdown URLs.",
  page: "has no page: declare it to get page Markdown and a Markdown URL.",
};

/** Returns a primitive's resolved pages, or throws when it declares none. */
export function requirePages<Resolved>(
  resolved: Resolved | undefined,
  { owner, option }: RequirePagesOptions,
) {
  if (!resolved) throw new Error(`${owner} ${MISSING[option]}`);
  return resolved;
}
